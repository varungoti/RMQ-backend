import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
  BadRequestException,
  HttpException,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, QueryFailedError, DataSource, EntityManager } from 'typeorm';
import { AssessmentSession, AssessmentStatus } from './entities/assessment_session.entity';
import { AssessmentResponse } from './entities/assessment_response.entity';
import { AssessmentSkillScore } from './entities/assessment_skill_score.entity';
import { Question, QuestionStatus, QuestionType } from './entities/question.entity';
import { User } from './entities/user.entity';
import { Skill, SkillStatus } from './entities/skill.entity';
import { StartAssessmentDto } from './dto/start-assessment.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { GetNextQuestionResponseDto, QuestionPublicDto, AssessmentResponseDto } from './dto/assessment.dto';
import { SkillScoreDto } from './dto/skill-score.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto'; // Import crypto for shuffling if needed, or use simple shuffle

// Constants for Elo-like calculation
const INITIAL_K = 32; // Initial K-factor (max score change)
const DECAY_RATE = 0.05; // Rate at which K-factor decreases per question

// Helper function to map Question entity to public DTO
const mapQuestionToPublicDto = (question: Question): QuestionPublicDto | null => {
  if (!question) {
      return null;
  }
  // Ensure primarySkill relation is loaded before passing
  if (!question.primarySkill) {
       // Log a warning and return null if essential relation is missing
       console.warn(`Warning: Primary skill not loaded for question ID ${question.id}. Cannot map to DTO.`);
       return null; 
  }

  return {
    id: question.id,
    questionText: question.questionText,
    type: question.questionType,
    options: question.options, // Pass the object directly
    skill: question.primarySkill, // Pass the loaded relation directly
    difficultyLevel: question.difficultyLevel,
  };
};

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);

  constructor(
    private dataSource: DataSource,
    @InjectRepository(AssessmentSession)
    private sessionsRepository: Repository<AssessmentSession>,
    @InjectRepository(AssessmentResponse)
    private responsesRepository: Repository<AssessmentResponse>,
    @InjectRepository(AssessmentSkillScore)
    private scoresRepository: Repository<AssessmentSkillScore>,
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Skill)
    private skillsRepository: Repository<Skill>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Starts a new assessment session for a user.
   * Fetches questions based on grade level and creates the session record.
   * @param userId - The ID of the user starting the session.
   * @param startAssessmentDto - DTO containing assessment parameters (e.g., gradeLevel).
   * @returns The newly created AssessmentSession object (potentially without relations loaded).
   * @throws NotFoundException if the user is not found.
   * @throws BadRequestException if no questions are found for the criteria.
   */
  async startSession(
    userId: string,
    startAssessmentDto: StartAssessmentDto,
  ): Promise<AssessmentSession> {
    this.logger.log(`Attempting to start assessment session for user ID: ${userId}`);

    // Get a query runner for transaction control
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // Use the query runner's manager for repository operations
        const transactionalEntityManager = queryRunner.manager;
        const userRepo = transactionalEntityManager.getRepository(User);
        const skillRepo = transactionalEntityManager.getRepository(Skill);
        const questionRepo = transactionalEntityManager.getRepository(Question);
        const sessionRepo = transactionalEntityManager.getRepository(AssessmentSession);

        const user = await userRepo.findOneBy({ id: userId });
        if (!user) {
            this.logger.error(`User with ID "${userId}" not found within transaction.`);
            throw new NotFoundException(`User with ID "${userId}" not found`);
        }

        const gradeLevel = startAssessmentDto.gradeLevel ?? user.gradeLevel;
        this.logger.log(`Determined grade level for assessment: ${gradeLevel}`);

        let sessionSkill: Skill | null = null;
        if (startAssessmentDto.skillId) {
            sessionSkill = await skillRepo.findOneBy({ id: startAssessmentDto.skillId });
        } else {
            sessionSkill = await skillRepo.findOne({
                where: { gradeLevel: gradeLevel, status: SkillStatus.ACTIVE }
            });
        }

        if (!sessionSkill) {
            this.logger.error(`No suitable skill found (Grade: ${gradeLevel}, SkillId: ${startAssessmentDto.skillId}) within transaction.`);
            throw new BadRequestException('Could not determine a skill for the assessment.');
        }
        this.logger.log(`Using skill "${sessionSkill.name}" (ID: ${sessionSkill.id}) for the session.`);

        const numberOfQuestionsToSelect = 10; 
        const poolMultiplier = 3; // Fetch 3x the number needed
        const fetchLimit = numberOfQuestionsToSelect * poolMultiplier;

        // Fetch a pool of recent questions instead of RANDOM()
        const questionPool = await questionRepo
            .createQueryBuilder('question', queryRunner)
            .where('question.gradeLevel = :gradeLevel', { gradeLevel })
            .andWhere('question.primary_skill_id = :skillId', { skillId: sessionSkill.id })
            .andWhere('question.status = :status', { status: QuestionStatus.ACTIVE })
            .orderBy('question.createdAt', 'DESC') // Order by creation date or another deterministic field
            .take(fetchLimit) // Fetch a larger pool
            .getMany();

        if (!questionPool || questionPool.length < numberOfQuestionsToSelect) {
            // Handle case where not even enough questions exist in the pool
            this.logger.warn(
                `Not enough active questions found (${questionPool?.length ?? 0}) for skill ${sessionSkill.id}, grade ${gradeLevel}. Required ${numberOfQuestionsToSelect}.`
            );
            // Optionally check if questionPool.length > 0 and proceed with fewer if allowed
            throw new BadRequestException(
                `Insufficient questions available for skill ${sessionSkill.name} at grade ${gradeLevel}.`
            );
        }

        // Shuffle the pool and take the required number
        const shuffledPool = this._shuffleArray(questionPool);
        const selectedQuestions = shuffledPool.slice(0, numberOfQuestionsToSelect);
        
        this.logger.log(`Selected ${selectedQuestions.length} questions from a pool of ${questionPool.length}.`);

        const questionIds = selectedQuestions.map((q) => q.id);

        const newSession = sessionRepo.create({
            user: user,
            status: AssessmentStatus.IN_PROGRESS,
            questionIds: questionIds,
            skill: sessionSkill, 
        });

        const savedSession = await sessionRepo.save(newSession); // Use transactional manager's repo
        this.logger.log(`Successfully created assessment session ID: ${savedSession.id} within transaction.`);
        
        // Commit transaction on success
        await queryRunner.commitTransaction();
        return savedSession;

    } catch (error) {
        // Rollback transaction on error
        this.logger.error(`Transaction failed during session start for user ${userId}. Rolling back. Error: ${error.message}`, error.stack);
        await queryRunner.rollbackTransaction();
        // Re-throw the error after rollback
        if (error instanceof HttpException) {
            throw error;
        } else if (error instanceof QueryFailedError) {
             throw new InternalServerErrorException(`Database error during session creation transaction: ${error.message}`);
        } else {
            throw new InternalServerErrorException('An unexpected error occurred while starting the assessment session transaction.');
        }
    } finally {
        // ALWAYS release the query runner
        await queryRunner.release();
        this.logger.log(`Query runner released for session start (User: ${userId})`);
    }
  }

  // Add a shuffle helper method (Fisher-Yates algorithm)
  private _shuffleArray<T>(array: T[]): T[] {
      let currentIndex = array.length, randomIndex;
  
      // While there remain elements to shuffle.
      while (currentIndex !== 0) {
  
          // Pick a remaining element.
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex--;
  
          // And swap it with the current element.
          [array[currentIndex], array[randomIndex]] = [
              array[randomIndex], array[currentIndex]];
      }
  
      return array;
  }

  /**
   * Get the next question for an assessment session
   * This method is now cached for better performance
   */
  async getNextQuestion(userId: string, sessionId: string): Promise<GetNextQuestionResponseDto> {
    // Try to get from cache first
    const cacheKey = `next_question:${userId}:${sessionId}`;
    const cachedResult = await this.cacheManager.get<GetNextQuestionResponseDto>(cacheKey);
    
    if (cachedResult) {
      this.logger.log(`[Service] Cache hit for getNextQuestion - session ${sessionId}`);
      return cachedResult;
    }
    
    this.logger.log(`[Service] Cache miss for getNextQuestion - session ${sessionId}`);
    
    // If not in cache, get from database
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId, user: { id: userId } },
      relations: ['responses', 'responses.question', 'skill'], // Ensure skill is loaded
    });

    if (!session) {
      this.logger.warn(`[Service] Session not found or doesn't belong to user: ${sessionId}`);
      throw new NotFoundException('Assessment session not found.');
    }

    // Check if session is already complete FIRST
    if (session.status === AssessmentStatus.COMPLETED) {
       this.logger.log(`[Service] Session ${sessionId} is already completed. Returning completion status.`);
       // Cache completed result (longer TTL since it won't change)
       const completedResult = { isComplete: true, nextQuestion: null };
       await this.cacheManager.set(cacheKey, completedResult, 3600000); // 1 hour
       return completedResult;
    }
    
    // Determine answered questions
    const answeredQuestionIds = session.responses.map(r => r.question.id);
    const unansweredQuestionIds = session.questionIds.filter(id => !answeredQuestionIds.includes(id));

    // Check if THIS response completes the session
    if (unansweredQuestionIds.length === 0) {
        this.logger.log(`[Service] All questions answered for session ${sessionId}. Marking as complete (in getNextQuestion).`);
        session.status = AssessmentStatus.COMPLETED;
        session.completedAt = new Date();
        const finalScoreResult = await this.calculateOverallScore(session.id);
        session.overallScore = finalScoreResult.score;
        session.overallLevel = finalScoreResult.level;
        await this.sessionsRepository.save(session);
        await this.updateSkillScore(userId, session.skill.id, session.overallScore, session.overallLevel);
        this.logger.log(`[Service] Session ${sessionId} marked complete via getNextQuestion. Score: ${session.overallScore}, Level: ${session.overallLevel}`);
        
        // Cache completed result (longer TTL)
        const completedResult = { isComplete: true, nextQuestion: null };
        await this.cacheManager.set(cacheKey, completedResult, 3600000); // 1 hour
        return completedResult;
    }

    // If not complete, find and return the next question
    const nextQuestionId = unansweredQuestionIds[0]; 
    const nextQuestionEntity = await this.questionsRepository.findOne({ 
        where: { id: nextQuestionId },
        relations: ['primarySkill'] // Ensure skill relation is loaded for DTO mapping
    });

    if (!nextQuestionEntity) {
      this.logger.error(`[Service] Consistency error: Next question ${nextQuestionId} not found for session ${sessionId}.`);
      throw new InternalServerErrorException(`Question ${nextQuestionId} configured for this session could not be found.`);
    }

    // Map entity to Public DTO
    const nextQuestionDto: QuestionPublicDto = {
        id: nextQuestionEntity.id,
        questionText: nextQuestionEntity.questionText,
        type: nextQuestionEntity.questionType,
        options: nextQuestionEntity.options, 
        skill: nextQuestionEntity.primarySkill, // Pass the loaded skill object
        difficultyLevel: nextQuestionEntity.difficultyLevel,
    };

    const result = {
      isComplete: false,
      nextQuestion: nextQuestionDto,
    };

    // Cache the result for a short time (will be invalidated on submit)
    await this.cacheManager.set(cacheKey, result, 60000); // 1 minute TTL

    this.logger.log(`[Service] Returning next question ${nextQuestionDto.id} for session ${sessionId}`);
    return result;
  }

  /**
   * Get the result of a session (now with caching)
   */
  async getSessionResult(userId: string, sessionId: string): Promise<SkillScoreDto> {
    // Try to get from cache first
    const cacheKey = `session_result:${userId}:${sessionId}`;
    const cachedResult = await this.cacheManager.get<SkillScoreDto>(cacheKey);
    
    if (cachedResult) {
      this.logger.log(`[Service] Cache hit for getSessionResult - session ${sessionId}`);
      return cachedResult;
    }
    
    this.logger.log(`[Service] Cache miss for getSessionResult - session ${sessionId}`);
    
    // If not in cache, get from database
    this.logger.log(`[Service] Getting result for session ${sessionId}, user ${userId}`);
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId, user: { id: userId } },
       relations: ['skill'],
    });

    if (!session) {
        this.logger.warn(`[Service] Session ${sessionId} not found or doesn't belong to user ${userId}`);
      throw new NotFoundException('Assessment session not found.');
    }

    if (session.status !== AssessmentStatus.COMPLETED) {
        this.logger.warn(`[Service] Session ${sessionId} is not completed (status: ${session.status}). Cannot get result.`);
      throw new BadRequestException('Assessment session is not completed yet.');
    }
    
    // Correct: Find skill score using user and skill ID
     const skillScore = await this.scoresRepository.findOne({
      where: {
          user: { id: userId },
          skill: { id: session.skill.id }
      },
    });
    
     if (!skillScore) {
        this.logger.error(`[Service] SkillScore record not found for completed session ${sessionId}, user ${userId}, skill ${session.skill.id}. Recalculating.`);
       const recalc = await this.calculateOverallScore(sessionId);
       // Correctly call updateSkillScore - IT handles creation/update
       const savedFallbackScore = await this.updateSkillScore(userId, session.skill.id, recalc.score, recalc.level);
        if (!savedFallbackScore) {
            this.logger.error(`[Service] Failed to save fallback skill score for session ${sessionId}`);
            throw new InternalServerErrorException('Could not retrieve or generate skill score.');
        }
         // Construct DTO from the correct object
         const result = {
          id: savedFallbackScore.id,
          userId: userId,
          skillId: session.skill.id,
          score: savedFallbackScore.score,
          level: savedFallbackScore.level,
          lastAssessedAt: savedFallbackScore.lastAssessedAt
        };
        
        // Cache result (longer TTL for completed sessions)
        await this.cacheManager.set(cacheKey, result, 3600000); // 1 hour TTL
        return result;
    }

    // Construct result and cache it
    const result = {
      id: skillScore.id,
      userId: userId, 
      skillId: session.skill.id,
      score: skillScore.score,
      level: skillScore.level,
      lastAssessedAt: skillScore.lastAssessedAt
    };
    
    // Cache result (longer TTL for completed sessions)
    await this.cacheManager.set(cacheKey, result, 3600000); // 1 hour TTL
    
    this.logger.log(`[Service] Found skill score record ${skillScore.id} for session ${sessionId}.`);
    return result;
  }

  /**
   * Submit an answer - also invalidates related caches
   */
  async submitAnswer(
    userId: string,
    submitAnswerDto: SubmitAnswerDto,
  ): Promise<AssessmentResponseDto> {
    const { assessmentSessionId, questionId, userResponse } = submitAnswerDto;
    this.logger.log(`[Service] User ${userId} submitting answer for session ${assessmentSessionId}, question ${questionId}`);
    
    // Validate session and user ownership
    const session = await this.validateSessionAndOwnership(userId, assessmentSessionId);
    
    // Validate question and check if already answered
    const question = await this.validateQuestionForSession(session, questionId);
    
    // Determine if the answer is correct
    const isCorrect = this.checkAnswer(question, userResponse);
    this.logger.log(`Q ${question.id} answer isCorrect: ${isCorrect}`);

    // Create response entity
    const response = this.createResponseEntity(session, question, userResponse, isCorrect);
    
    try {
      // Process the submission with transaction
      const savedResponse = await this.processSubmissionWithTransaction(response, session, question, isCorrect);
      
      // Invalidate related caches
      const nextQuestionCacheKey = `next_question:${userId}:${assessmentSessionId}`;
      await this.cacheManager.del(nextQuestionCacheKey);
      
      if (isCorrect) {
        // Also invalidate session result cache if the score might change
        const resultCacheKey = `session_result:${userId}:${assessmentSessionId}`;
        await this.cacheManager.del(resultCacheKey);
      }
      
      // Map to DTO and return
      return this.mapToResponseDto(savedResponse);
    } catch (error) {
      this.logger.error(`Transaction failed during answer submission: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to process answer due to internal error.', { cause: error });
    }
  }

  /**
   * Transactional version of _updateSkillScore helper.
   * Must be passed the transactional EntityManager.
   */
  private async _updateSkillScoreTransactional(
    entityManager: import('typeorm').EntityManager, // Use specific type
    session: AssessmentSession,
    skillId: string,
    isCorrect: boolean,
  ): Promise<void> {
    const scoreRepo = entityManager.getRepository(AssessmentSkillScore);
    this.logger.log(`Updating score (transactional) for session ${session.id}, skill ${skillId}, correct: ${isCorrect}`);

    let skillScore = await scoreRepo.findOneBy({
      user: { id: session.user.id },
      skill: { id: skillId },
    });

    const currentScore = skillScore?.score ?? 500;
    const questionsAttempted = skillScore?.questionsAttempted ?? 0;
    const newQuestionsAttempted = questionsAttempted + 1;

    const kFactor = INITIAL_K / (1 + questionsAttempted * DECAY_RATE);
    const actualOutcome = isCorrect ? 1 : 0;
    const expectedOutcome = 0.5;
    const newScore = currentScore + kFactor * (actualOutcome - expectedOutcome);

    if (skillScore) {
      skillScore.score = newScore;
      skillScore.questionsAttempted = newQuestionsAttempted;
      this.logger.log(
        `Updating existing skill score ID ${skillScore.id}. New score: ${newScore.toFixed(2)} (${newQuestionsAttempted} attempted)`,
      );
    } else {
      skillScore = scoreRepo.create({
        user: { id: session.user.id },
        skill: { id: skillId },
        score: newScore,
        questionsAttempted: newQuestionsAttempted,
      });
      this.logger.log(
        `Creating new skill score. Score: ${newScore.toFixed(2)} (${newQuestionsAttempted} attempted)`,
      );
    }

    // Save using the provided transactional entity manager's repository
    await scoreRepo.save(skillScore);
    this.logger.log(`Skill score saved successfully (transactional) for skill ${skillId}.`);
    // No separate error handling here, transaction will catch it
  }

  /**
   * Calculates the overall score for an assessment session.
   * @param sessionId The ID of the assessment session.
   * @returns An object containing the score and level.
   */
  async calculateOverallScore(sessionId: string): Promise<{ score: number; level: number }> {
    this.logger.log(`[Service] Calculating overall score for session ${sessionId}`);
    
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId },
      relations: ['responses', 'responses.question'],
    });

    if (!session) {
      this.logger.warn(`[Service] Session not found when calculating score: ${sessionId}`);
      throw new NotFoundException('Assessment session not found.');
    }

    // Check if any responses exist
    if (!session.responses || session.responses.length === 0) {
      this.logger.warn(`[Service] No responses found for session ${sessionId} when calculating score`);
      return { score: 0, level: 0 };
    }

    // Calculate score based on correct answers
    const totalQuestions = session.questionIds.length;
    const correctAnswers = session.responses.filter(response => response.isCorrect).length;
    
    // Basic percentage calculation
    const percentageCorrect = (correctAnswers / totalQuestions) * 100;
    
    // Determine level based on score
    let level = 0;
    if (percentageCorrect >= 90) {
      level = 3; // Advanced
    } else if (percentageCorrect >= 70) {
      level = 2; // Proficient
    } else if (percentageCorrect >= 50) {
      level = 1; // Basic
    }
    
    this.logger.log(`[Service] Score calculated for session ${sessionId}: ${percentageCorrect.toFixed(2)}%, level: ${level}`);
    
    return {
      score: Math.round(percentageCorrect),
      level,
    };
  }

  /**
   * Updates or creates a skill score for a user.
   * @param userId The user ID.
   * @param skillId The skill ID.
   * @param score The score to set.
   * @param level The level to set.
   * @returns The updated or created skill score.
   */
  async updateSkillScore(userId: string, skillId: string, score: number, level: number): Promise<AssessmentSkillScore> {
    this.logger.log(`[Service] Updating skill score for user ${userId}, skill ${skillId}, score ${score}, level ${level}`);
    
    // Find existing score or create new one
    let skillScore = await this.scoresRepository.findOne({
      where: {
        user: { id: userId },
        skill: { id: skillId },
      },
    });

    const now = new Date();

    if (skillScore) {
      // Update existing score
      skillScore.score = score;
      skillScore.level = level;
      skillScore.lastAssessedAt = now;
      this.logger.log(`[Service] Updating existing skill score ID ${skillScore.id} for user ${userId}`);
    } else {
      // Create new score
      skillScore = this.scoresRepository.create({
        user: { id: userId },
        skill: { id: skillId },
        score,
        level,
        lastAssessedAt: now,
        questionsAttempted: 0, // This will be incremented by _updateSkillScoreTransactional
      });
      this.logger.log(`[Service] Creating new skill score for user ${userId}, skill ${skillId}`);
    }

    try {
      return await this.scoresRepository.save(skillScore);
    } catch (error) {
      this.logger.error(`[Service] Error saving skill score: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update skill score.');
    }
  }

  /**
   * Validates if a session exists and belongs to the user.
   * @param userId The user ID.
   * @param sessionId The session ID.
   * @returns The validated session.
   */
  async validateSessionAndOwnership(userId: string, sessionId: string): Promise<AssessmentSession> {
    this.logger.log(`[Service] Validating session ${sessionId} ownership for user ${userId}`);
    
    if (!userId) {
      this.logger.error('[Service] validateSessionAndOwnership called with empty userId');
      throw new UnauthorizedException('User authentication required.');
    }
    
    if (!sessionId) {
      this.logger.error('[Service] validateSessionAndOwnership called with empty sessionId');
      throw new BadRequestException('Assessment session ID is required.');
    }
    
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId },
      relations: ['user', 'skill'],
    });

    if (!session) {
      this.logger.warn(`[Service] Session ${sessionId} not found during validation`);
      throw new NotFoundException('Assessment session not found or has expired.');
    }

    if (!session.user) {
      this.logger.error(`[Service] Session ${sessionId} has no associated user`);
      throw new InternalServerErrorException('Session data is corrupted. Please contact support.');
    }

    if (session.user.id !== userId) {
      this.logger.warn(`[Service] User ${userId} attempted to access session ${sessionId} owned by ${session.user.id}`);
      throw new ForbiddenException('You do not have access to this assessment session. Please use a session created for your account.');
    }

    if (session.status === AssessmentStatus.COMPLETED) {
      this.logger.warn(`[Service] User ${userId} attempted to submit answer to completed session ${sessionId}`);
      throw new BadRequestException('This assessment session is already completed. Please start a new assessment if you wish to continue.');
    }

    return session;
  }

  /**
   * Validates if a question belongs to the session and is unanswered.
   * @param session The assessment session.
   * @param questionId The question ID.
   * @returns The validated question.
   */
  async validateQuestionForSession(
    session: AssessmentSession,
    questionId: string,
  ): Promise<Question> {
    this.logger.debug(`Validating question ${questionId} for session ${session.id}`);

    // Load the session questions if we need more detailed session data
    const populatedSession = await this.sessionsRepository.findOne({
      where: { id: session.id },
      relations: ['skill'], // Load related data if needed
    });

    if (!populatedSession) {
      throw new NotFoundException(`Session ${session.id} not found`);
    }

    // Check if the question ID is in the session's questionIds array
    if (!populatedSession.questionIds || !populatedSession.questionIds.includes(questionId)) {
      throw new BadRequestException(
        `Question ${questionId} is not part of session ${session.id}`,
      );
    }

    // Find the question in the repository
    const question = await this.questionsRepository.findOne({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`Question ${questionId} not found`);
    }

    return question;
  }

  /**
   * Checks if a user's answer is correct.
   * @param question The question entity.
   * @param userResponse The user's response.
   * @returns Whether the answer is correct.
   */
  checkAnswer(question: Question, userResponse: string): boolean {
    this.logger.log(`[Service] Checking answer for question ${question.id}, user response: ${userResponse}`);
    
    // For MCQ and TRUE_FALSE, just do a direct comparison
    const correctAnswer = question.correctAnswer;
    
    // Compare user's answer with the correct answer
    const isCorrect = userResponse.toLowerCase() === correctAnswer.toLowerCase();
    
    this.logger.log(`[Service] Answer check result: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
    return isCorrect;
  }

  /**
   * Creates a response entity for an answer submission.
   * @param session The assessment session.
   * @param question The question.
   * @param userResponse The user's response.
   * @param isCorrect Whether the answer is correct.
   * @returns The created response entity.
   */
  createResponseEntity(
    session: AssessmentSession,
    question: Question,
    userResponse: string,
    isCorrect: boolean,
  ): AssessmentResponse {
    return this.responsesRepository.create({
      assessmentSession: session,
      question,
      userResponse,
      isCorrect,
      answeredAt: new Date(),
    });
  }

  /**
   * Processes an answer submission with transaction support.
   * @param response The assessment response entity.
   * @param session The assessment session.
   * @param question The question.
   * @param isCorrect Whether the answer is correct.
   * @returns The saved response.
   */
  async processSubmissionWithTransaction(
    response: AssessmentResponse,
    session: AssessmentSession,
    question: Question,
    isCorrect: boolean,
  ): Promise<AssessmentResponse> {
    // Create a query runner for transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Get repositories from transaction manager
      const responseRepo = queryRunner.manager.getRepository(AssessmentResponse);
      const questionRepo = queryRunner.manager.getRepository(Question);
      
      // Ensure question has primarySkill loaded
      if (!question.primarySkill) {
        this.logger.log(`[Service] Loading primarySkill relation for question ${question.id}`);
        question = await questionRepo.findOne({
          where: { id: question.id },
          relations: ['primarySkill'],
        });
        
        if (!question || !question.primarySkill) {
          throw new InternalServerErrorException('Failed to load question with its skill relationship.');
        }
      }
      
      // Save the response
      const savedResponse = await responseRepo.save(response);
      
      // Update skill score transactionally
      await this._updateSkillScoreTransactional(
        queryRunner.manager,
        session,
        question.primarySkill.id,
        isCorrect,
      );
      
      // Check if this was the last question
      const sessionWithResponses = await queryRunner.manager.getRepository(AssessmentSession).findOne({
        where: { id: session.id },
        relations: ['responses'],
      });
      
      // If all questions answered, mark session as complete
      if (sessionWithResponses.responses.length >= sessionWithResponses.questionIds.length) {
        sessionWithResponses.status = AssessmentStatus.COMPLETED;
        sessionWithResponses.completedAt = new Date();
        
        // Calculate final score
        const finalScore = await this.calculateOverallScore(session.id);
        sessionWithResponses.overallScore = finalScore.score;
        sessionWithResponses.overallLevel = finalScore.level;
        
        await queryRunner.manager.getRepository(AssessmentSession).save(sessionWithResponses);
        
        this.logger.log(`[Service] Session ${session.id} marked complete. Score: ${finalScore.score}, Level: ${finalScore.level}`);
      }
      
      // Commit transaction
      await queryRunner.commitTransaction();
      return savedResponse;
    } catch (error) {
      // Rollback on error
      await queryRunner.rollbackTransaction();
      this.logger.error(`[Service] Transaction failed during submission: ${error.message}`, error.stack);
      
      // Provide user-friendly error messages based on error type
      if (error instanceof QueryFailedError) {
        throw new InternalServerErrorException('Database error occurred while processing your answer. Please try again.');
      } else if (error instanceof HttpException) {
        // Re-throw HTTP exceptions as they already have user-friendly messages
        throw error;
      } else {
        throw new InternalServerErrorException('Failed to process your answer due to an unexpected error. Please try again later.');
      }
    } finally {
      // Always release the query runner
      await queryRunner.release();
    }
  }

  /**
   * Maps an assessment response entity to a DTO.
   * @param response The assessment response entity.
   * @returns The mapped DTO.
   */
  mapToResponseDto(response: AssessmentResponse): AssessmentResponseDto {
    return {
      id: response.id,
      isCorrect: response.isCorrect,
      assessmentSession: response.assessmentSession,
      question: response.question,
      userResponse: response.userResponse,
      answeredAt: response.answeredAt,
    };
  }

  /**
   * Start a new assessment session for a user (wrapper for startSession).
   * @param userId - The ID of the user starting the assessment.
   * @param startAssessmentDto - DTO containing assessment parameters.
   * @returns The newly created AssessmentSession.
   */
  async startAssessment(
    userId: string, 
    startAssessmentDto: StartAssessmentDto
  ): Promise<AssessmentSession> {
    this.logger.log(`[Service] Attempting to start assessment for user ${userId}, skill ${startAssessmentDto.skillId}`);
    return this.startSession(userId, startAssessmentDto);
  }

  // submitAnswer, getNextQuestion, completeSession methods etc. to follow

}
