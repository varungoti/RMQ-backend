import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { AssessmentSession, AssessmentStatus } from '../entities/assessment_session.entity';
import { AssessmentResponse } from '../entities/assessment_response.entity';
import { Question, QuestionStatus, QuestionType } from '../entities/question.entity';
import { Skill, SkillStatus } from '../entities/skill.entity';
import { AssessmentSkillScore } from '../entities/assessment_skill_score.entity';
import { SubmitAnswerDto } from '../dto/submit-answer.dto';
import { StartAssessmentDto } from '../dto/start-assessment.dto';
import { User } from '../entities/user.entity';
import { GetNextQuestionResponseDto, QuestionPublicDto, AssessmentResponseDto } from '../dto/assessment.dto';
import { SkillScoreDto } from '../dto/skill-score.dto';
import { AnswerCheckerFactory } from './factories/answer-checker.factory';

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);

  constructor(
    @InjectRepository(AssessmentSession)
    private sessionRepository: Repository<AssessmentSession>,
    @InjectRepository(AssessmentResponse)
    private responseRepository: Repository<AssessmentResponse>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Skill)
    private skillRepository: Repository<Skill>,
    @InjectRepository(AssessmentSkillScore)
    private scoreRepository: Repository<AssessmentSkillScore>,
    private dataSource: DataSource,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private answerCheckerFactory: AnswerCheckerFactory,
  ) {}

  /**
   * Submit an answer for a question in an assessment session
   * @param userId The ID of the user submitting the answer
   * @param submitAnswerDto DTO containing session ID, question ID, and user's response
   * @returns Assessment response data including correctness
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
      
      // Map to DTO and return
      return this.mapToResponseDto(savedResponse);
    } catch (error) {
      this.logger.error(`Transaction failed during answer submission: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to process answer due to internal error.', { cause: error });
    }
  }

  /**
   * Validate session exists and user owns it
   */
  private async validateSessionAndOwnership(userId: string, sessionId: string): Promise<AssessmentSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, user: { id: userId } },
      relations: ['skill', 'user'],
    });

    if (!session) {
      this.logger.error(`[Service] Session ${sessionId} not found for submitAnswer`);
      throw new NotFoundException(`Assessment session ${sessionId} not found.`);
    }

    if (session.user.id !== userId) {
      this.logger.error(`[Service] User ${userId} forbidden from accessing session ${sessionId} owned by ${session.user.id}`);
      throw new ForbiddenException('You do not own this assessment session.');
    }

    if (session.status !== AssessmentStatus.IN_PROGRESS) {
      this.logger.error(`[Service] Attempt to submit answer for non-active session ${sessionId} (status: ${session.status})`);
      throw new BadRequestException('This assessment session is not in progress.');
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
    this.logger.log(`[Service] Validating question ${questionId} for session ${session.id}`);
    
    if (!questionId) {
      this.logger.error('[Service] validateQuestionForSession called with empty questionId');
      throw new BadRequestException('Question ID is required.');
    }

    // Check if the question ID is in the session's questionIds array
    if (!session.questionIds.includes(questionId)) {
      this.logger.warn(`[Service] Question ${questionId} not found in session ${session.id}'s questionIds`);
      throw new NotFoundException('Question not found in this assessment session. Please use a valid question from the current assessment.');
    }

    // Load question from repository with relations
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: ['primarySkill'],
    });

    if (!question) {
      this.logger.error(`[Service] Question ${questionId} not found in database`);
      throw new NotFoundException('Question not found. Please try a different question.');
    }

    // Check if the question has already been answered in this session
    const isAnswered = await this.responseRepository.findOne({
      where: {
        assessmentSession: { id: session.id },
        question: { id: questionId },
      },
    });

    if (isAnswered) {
      this.logger.warn(`[Service] Question ${questionId} already answered in session ${session.id}`);
      throw new BadRequestException('This question has already been answered. Please proceed to the next question.');
    }

    return question;
  }

  /**
   * Create a response entity
   */
  private createResponseEntity(
    session: AssessmentSession,
    question: Question,
    userResponse: string,
    isCorrect: boolean
  ): AssessmentResponse {
    return this.responseRepository.create({
      assessmentSession: session,
      question: question,
      userResponse: userResponse,
      isCorrect: isCorrect,
      answeredAt: new Date(),
    });
  }

  /**
   * Process the submission within a transaction
   */
  private async processSubmissionWithTransaction(
    response: AssessmentResponse,
    session: AssessmentSession,
    question: Question,
    isCorrect: boolean
  ): Promise<AssessmentResponse> {
    let savedResponse: AssessmentResponse | null = null;
    
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      // Save the response
      this.logger.log(`Saving response for Q ${question.id}, Session ${session.id}`);
      savedResponse = await transactionalEntityManager.save(AssessmentResponse, response);
      this.logger.log(`Response saved with ID: ${savedResponse?.id}`);
      
      // Update skill score if skill exists
      if (session.skill) {
        this.logger.log(`Updating skill score for Skill ${session.skill?.id}, Session ${session.id}`);
        await this._updateSkillScoreTransactional(transactionalEntityManager, session, question, isCorrect);
      } else {
        this.logger.warn(`Skill not found on session ${session.id}, skipping score update.`);
      }
      
      // Update session status if all questions answered
      await this.updateSessionStatusIfComplete(transactionalEntityManager, session);
    });

    // Ensure a response ID was generated
    if (!savedResponse?.id) {
      this.logger.error(`Saved response ID is null after transaction for session ${session.id}`);
      throw new InternalServerErrorException('Failed to retrieve saved response ID after transaction.');
    }

    // Refetch the complete response with relations
    const fetchedResponse = await this.responseRepository.findOne({
      where: { id: savedResponse.id },
      relations: ['assessmentSession', 'question', 'question.primarySkill'],
    });

    if (!fetchedResponse) {
      this.logger.error(`Failed to refetch response with ID: ${savedResponse.id} after commit.`);
      throw new InternalServerErrorException('Could not retrieve the response details after saving.');
    }

    return fetchedResponse;
  }

  /**
   * Update session status if all questions are answered
   */
  private async updateSessionStatusIfComplete(
    entityManager: EntityManager,
    session: AssessmentSession
  ): Promise<void> {
    const responseCount = await entityManager.count(AssessmentResponse, {
      where: { assessmentSession: { id: session.id } },
    });
    
    this.logger.log(`Session ${session.id} response count: ${responseCount} / ${session.questionIds.length}`);
    
    if (responseCount >= session.questionIds.length) {
      this.logger.log(`Session ${session.id} is complete, updating status.`);
      session.status = AssessmentStatus.COMPLETED;
      session.completedAt = new Date();
      await entityManager.save(AssessmentSession, session);
      this.logger.log(`Session ${session.id} status updated to COMPLETED.`);
    }
  }

  /**
   * Map a response entity to DTO
   */
  private mapToResponseDto(response: AssessmentResponse): AssessmentResponseDto {
    const responseDto = new AssessmentResponseDto();
    responseDto.id = response.id;
    responseDto.userResponse = response.userResponse;
    responseDto.isCorrect = response.isCorrect;
    responseDto.answeredAt = response.answeredAt;
    responseDto.responseTimeMs = response.responseTimeMs;
    responseDto.assessmentSession = {
      id: response.assessmentSession.id,
      status: response.assessmentSession.status
    };
    responseDto.question = {
      id: response.question.id,
      questionText: response.question.questionText,
      questionType: response.question.questionType,
      options: response.question.options as Record<string, unknown>,
      difficultyLevel: response.question.difficultyLevel
    };
    
    this.logger.log(`[SERVICE RETURN] submitAnswer result: ${JSON.stringify({
      id: responseDto.id,
      isCorrect: responseDto.isCorrect,
      assessmentSession: { 
        id: responseDto.assessmentSession.id,
        status: responseDto.assessmentSession.status
      }
    })}`);
    
    return responseDto;
  }

  /**
   * Check if the user's answer is correct using the appropriate checker
   * @param question The question entity
   * @param userResponse The user's submitted answer
   * @returns True if the answer is correct, false otherwise
   */
  private checkAnswer(question: Question, userResponse: string): boolean {
    this.logger.log(`[Service] Checking answer for question ${question.id} of type ${question.questionType}`);
    
    try {
      // Use the factory to get the appropriate checker and check the answer
      const isCorrect = this.answerCheckerFactory.checkAnswer(question, userResponse);
      this.logger.log(`[Service] Answer check result: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
      return isCorrect;
    } catch (error) {
      // Log error and fallback to simple comparison in case of exceptions
      this.logger.error(`Error during answer checking: ${error.message}`, error.stack);
      this.logger.warn('Falling back to simple string comparison');
      
      // Simple fallback implementation
      return question.correctAnswer.toLowerCase() === userResponse.toLowerCase();
    }
  }

  private async _updateSkillScoreTransactional(
    entityManager: EntityManager,
    session: AssessmentSession,
    question: Question,
    isCorrect: boolean,
  ): Promise<void> {
    this.logger.debug(`Updating score for session ${session.id}, skill ${session.skill.id}, Q ${question.id}`);
    
    let skillScore = await entityManager.findOne(AssessmentSkillScore, {
        where: { user: { id: session.user.id }, skill: { id: session.skill.id } }
    });

    if (!skillScore) {
        this.logger.log(`No existing score found for session ${session.id}, skill ${session.skill.id}. Creating new.`);
        skillScore = entityManager.create(AssessmentSkillScore, {
            user: { id: session.user.id },
            skill: session.skill,
            score: 0,
            questionsAttempted: 0,
            level: 0,
        });
    }

    // ADD LOGGING FOR RAW skillScore.score
    this.logger.log(`[SCORE CALC START] Raw skillScore.score - Type: ${typeof skillScore.score}, Value: ${skillScore.score}`);

    // Ensure numeric calculation
    let currentScore = Number(skillScore.score ?? 0);
    let difficulty = Number(question.difficultyLevel || 100); // Default to 100 if null/undefined/0
    const scoreDelta = isCorrect ? difficulty : 0;
    
    // Ensure difficulty wasn't NaN or invalid
    if (isNaN(difficulty)) {
        this.logger.warn(`Question ${question.id} has invalid difficultyLevel: ${question.difficultyLevel}. Using default delta 100 if correct.`);
        difficulty = 100;
    }
    
    let newScore = currentScore + (isCorrect ? difficulty : 0);

    // Final check for NaN before assigning
    if (isNaN(newScore)) {
        this.logger.error(`Calculated newScore is NaN for session ${session.id}, Q ${question.id}. currentScore=${currentScore}, difficulty=${difficulty}, isCorrect=${isCorrect}. Keeping original score.`);
        newScore = currentScore; // Fallback to current score if calculation fails
    }

    // ADD LOGGING FOR TYPE AND VALUE
    this.logger.log(`[SCORE ASSIGNMENT] Type: ${typeof newScore}, Value: ${newScore}`);

    skillScore.score = newScore; 
    skillScore.questionsAttempted = (skillScore.questionsAttempted ?? 0) + 1;

    this.logger.debug(`Saving updated score for session ${session.id}: Score ${skillScore.score}, Attempted ${skillScore.questionsAttempted}`);
    await entityManager.save(AssessmentSkillScore, skillScore); 
  }

  async startAssessment(userId: string, startAssessmentDto: StartAssessmentDto): Promise<AssessmentSession> {
    this.logger.log(`[Service] Attempting to start assessment for user ${userId}, skill ${startAssessmentDto.skillId}`);
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
        this.logger.error(`[Service] User not found for ID: ${userId} in startAssessment`);
        throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    const skill = await this.skillRepository.findOneBy({ id: startAssessmentDto.skillId, status: SkillStatus.ACTIVE });
    if (!skill) {
        this.logger.error(`[Service] Active skill not found for ID: ${startAssessmentDto.skillId} in startAssessment`);
        throw new NotFoundException(`Active skill with ID ${startAssessmentDto.skillId} not found.`);
    }

    const questions = await this.questionRepository.find({
        where: {
            primarySkill: { id: skill.id },
            gradeLevel: user.gradeLevel,
            status: QuestionStatus.ACTIVE,
        },
        take: 10, 
    });

    if (questions.length === 0) {
        this.logger.error(`[Service] No active questions found for skill ${skill.id} at grade level ${user.gradeLevel}`);
        throw new NotFoundException(`No active questions found for skill ${skill.id} at grade level ${user.gradeLevel}`);
    }

    const questionIds = questions.map(q => q.id);
    for (let i = questionIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionIds[i], questionIds[j]] = [questionIds[j], questionIds[i]];
    }
    
    const newSession = this.sessionRepository.create({
        user: user,
        skill: skill,
        status: AssessmentStatus.IN_PROGRESS,
        questionIds: questionIds,
        startedAt: new Date(),
    });

    await this.sessionRepository.save(newSession);
    this.logger.log(`[Service] Assessment session ${newSession.id} created successfully for user ${userId}. Questions: ${questionIds.length}`);
    return this.sessionRepository.findOne({ 
        where: { id: newSession.id },
        relations: ['user', 'skill']
    });
  }

  async getNextQuestion(userId: string, sessionId: string): Promise<GetNextQuestionResponseDto> {
    this.logger.log(`[Service] Getting next question for user ${userId}, session ${sessionId}`);
    const session = await this.sessionRepository.findOne({
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
       return { isComplete: true, nextQuestion: null };
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
        await this.sessionRepository.save(session);
        await this.updateSkillScore(userId, session.skill.id, session.overallScore, session.overallLevel);
        this.logger.log(`[Service] Session ${sessionId} marked complete via getNextQuestion. Score: ${session.overallScore}, Level: ${session.overallLevel}`);
        return { isComplete: true, nextQuestion: null };
    }

    // If not complete, find and return the next question
    const nextQuestionId = unansweredQuestionIds[0]; 
    const nextQuestionEntity = await this.questionRepository.findOne({ 
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
        // Explicitly exclude correctAnswer, gradeLevel, status etc. 
    };

    this.logger.log(`[Service] Returning next question ${nextQuestionDto.id} for session ${sessionId}`);
    return {
      isComplete: false,
      nextQuestion: nextQuestionDto, // Return the DTO
      // Remove progress field
    };
  }

  /**
   * Calculate overall score for a session
   */
  async calculateOverallScore(sessionId: string): Promise<{ score: number; level: number }> {
    this.logger.log(`[Service] Calculating score for session ${sessionId}`);
    const responses = await this.responseRepository.find({
        where: { assessmentSession: { id: sessionId } },
        relations: ['question'],
    });

    if (responses.length === 0) {
        this.logger.log(`[Service] No responses found for session ${sessionId}, score is 0.`);
        return { score: 0, level: 1 }; 
    }

    let totalWeightedScore = 0;
    let totalWeight = 0;

    responses.forEach(response => {
        const difficultyWeight = response.question.difficultyLevel || 1; 
        totalWeight += difficultyWeight;
        if (response.isCorrect) {
            totalWeightedScore += difficultyWeight;
        }
    });

    const scorePercentage = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;
    const level = this.determineLevel(scorePercentage);
    const finalScore = Math.round(scorePercentage);

    this.logger.log(`[Service] Calculated score for session ${sessionId}: ${finalScore}%, Level: ${level}`);
    return { score: finalScore, level };
  }

  /**
   * Determine skill level based on score percentage
   */
  private determineLevel(scorePercentage: number): number {
    if (scorePercentage >= 90) return 5;
    if (scorePercentage >= 75) return 4;
    if (scorePercentage >= 60) return 3;
    if (scorePercentage >= 40) return 2;
    return 1;
  }

  /**
   * Update skill score for a user
   */
  async updateSkillScore(userId: string, skillId: string, score: number, level: number): Promise<AssessmentSkillScore> {
    this.logger.log(`[Service] Updating skill score for user ${userId}, skill ${skillId}. Score: ${score}, Level: ${level}`);
    
    // Use query builder to handle potential race conditions or ensure atomicity if needed, 
    // but simple findOne/create works for now.
    let skillScore = await this.scoreRepository.findOne({
        where: { 
            user: { id: userId }, 
            skill: { id: skillId } 
        },
        relations: ['user', 'skill'], // Load relations to avoid issues with saving partial entities
    });

    const now = new Date();

    if (skillScore) {
        skillScore.score = score;
        skillScore.level = level;
        skillScore.lastAssessedAt = now; // Update the timestamp
        this.logger.log(`[Service] Updating existing skill score record ${skillScore.id}`);
    } else {
        this.logger.log(`[Service] Creating new skill score record for user ${userId}, skill ${skillId}`);
        skillScore = this.scoreRepository.create({
            user: { id: userId }, 
            skill: { id: skillId }, 
            score: score,
            level: level,
            lastAssessedAt: now, // Set timestamp on creation
        });
    }

    try {
        const savedScore = await this.scoreRepository.save(skillScore);
        this.logger.log(`[Service] Skill score saved/updated successfully. Record ID: ${savedScore.id}`);
        return savedScore;
    } catch (error) {
        this.logger.error(`[Service] Error saving skill score for user ${userId}, skill ${skillId}: ${error.message}`, error.stack);
        throw new InternalServerErrorException('Could not save skill score.');
    }
  }
  
  async getSessionResult(userId: string, sessionId: string): Promise<SkillScoreDto> {
    this.logger.log(`[Service] Getting result for session ${sessionId}, user ${userId}`);
    const session = await this.sessionRepository.findOne({
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
     const skillScore = await this.scoreRepository.findOne({
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
         return {
          id: savedFallbackScore.id,
          userId: userId,
          skillId: session.skill.id,
          score: savedFallbackScore.score,
          level: savedFallbackScore.level,
          lastAssessedAt: savedFallbackScore.lastAssessedAt
        };
    }

     this.logger.log(`[Service] Found skill score record ${skillScore.id} for session ${sessionId}.`);
    return {
      id: skillScore.id,
      userId: userId, 
      skillId: session.skill.id,
      score: skillScore.score,
      level: skillScore.level,
      lastAssessedAt: skillScore.lastAssessedAt
    };
  }
} 