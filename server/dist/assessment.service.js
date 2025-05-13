"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AssessmentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const assessment_session_entity_1 = require("./entities/assessment_session.entity");
const assessment_response_entity_1 = require("./entities/assessment_response.entity");
const assessment_skill_score_entity_1 = require("./entities/assessment_skill_score.entity");
const question_entity_1 = require("./entities/question.entity");
const user_entity_1 = require("./entities/user.entity");
const skill_entity_1 = require("./entities/skill.entity");
const cache_manager_1 = require("@nestjs/cache-manager");
const INITIAL_K = 32;
const DECAY_RATE = 0.05;
const mapQuestionToPublicDto = (question) => {
    if (!question) {
        return null;
    }
    if (!question.primarySkill) {
        console.warn(`Warning: Primary skill not loaded for question ID ${question.id}. Cannot map to DTO.`);
        return null;
    }
    return {
        id: question.id,
        questionText: question.questionText,
        type: question.questionType,
        options: question.options,
        skill: question.primarySkill,
        difficultyLevel: question.difficultyLevel,
    };
};
let AssessmentService = AssessmentService_1 = class AssessmentService {
    constructor(dataSource, sessionsRepository, responsesRepository, scoresRepository, questionsRepository, usersRepository, skillsRepository, cacheManager) {
        this.dataSource = dataSource;
        this.sessionsRepository = sessionsRepository;
        this.responsesRepository = responsesRepository;
        this.scoresRepository = scoresRepository;
        this.questionsRepository = questionsRepository;
        this.usersRepository = usersRepository;
        this.skillsRepository = skillsRepository;
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(AssessmentService_1.name);
    }
    async startSession(userId, startAssessmentDto) {
        this.logger.log(`Attempting to start assessment session for user ID: ${userId}`);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const transactionalEntityManager = queryRunner.manager;
            const userRepo = transactionalEntityManager.getRepository(user_entity_1.User);
            const skillRepo = transactionalEntityManager.getRepository(skill_entity_1.Skill);
            const questionRepo = transactionalEntityManager.getRepository(question_entity_1.Question);
            const sessionRepo = transactionalEntityManager.getRepository(assessment_session_entity_1.AssessmentSession);
            const user = await userRepo.findOneBy({ id: userId });
            if (!user) {
                this.logger.error(`User with ID "${userId}" not found within transaction.`);
                throw new common_1.NotFoundException(`User with ID "${userId}" not found`);
            }
            const gradeLevel = startAssessmentDto.gradeLevel ?? user.gradeLevel;
            this.logger.log(`Determined grade level for assessment: ${gradeLevel}`);
            let sessionSkill = null;
            if (startAssessmentDto.skillId) {
                sessionSkill = await skillRepo.findOneBy({ id: startAssessmentDto.skillId });
            }
            else {
                sessionSkill = await skillRepo.findOne({
                    where: { gradeLevel: gradeLevel, status: skill_entity_1.SkillStatus.ACTIVE }
                });
            }
            if (!sessionSkill) {
                this.logger.error(`No suitable skill found (Grade: ${gradeLevel}, SkillId: ${startAssessmentDto.skillId}) within transaction.`);
                throw new common_1.BadRequestException('Could not determine a skill for the assessment.');
            }
            this.logger.log(`Using skill "${sessionSkill.name}" (ID: ${sessionSkill.id}) for the session.`);
            const numberOfQuestionsToSelect = 10;
            const poolMultiplier = 3;
            const fetchLimit = numberOfQuestionsToSelect * poolMultiplier;
            const questionPool = await questionRepo
                .createQueryBuilder('question', queryRunner)
                .where('question.gradeLevel = :gradeLevel', { gradeLevel })
                .andWhere('question.primary_skill_id = :skillId', { skillId: sessionSkill.id })
                .andWhere('question.status = :status', { status: question_entity_1.QuestionStatus.ACTIVE })
                .orderBy('question.createdAt', 'DESC')
                .take(fetchLimit)
                .getMany();
            if (!questionPool || questionPool.length < numberOfQuestionsToSelect) {
                this.logger.warn(`Not enough active questions found (${questionPool?.length ?? 0}) for skill ${sessionSkill.id}, grade ${gradeLevel}. Required ${numberOfQuestionsToSelect}.`);
                throw new common_1.BadRequestException(`Insufficient questions available for skill ${sessionSkill.name} at grade ${gradeLevel}.`);
            }
            const shuffledPool = this._shuffleArray(questionPool);
            const selectedQuestions = shuffledPool.slice(0, numberOfQuestionsToSelect);
            this.logger.log(`Selected ${selectedQuestions.length} questions from a pool of ${questionPool.length}.`);
            const questionIds = selectedQuestions.map((q) => q.id);
            const newSession = sessionRepo.create({
                user: user,
                status: assessment_session_entity_1.AssessmentStatus.IN_PROGRESS,
                questionIds: questionIds,
                skill: sessionSkill,
            });
            const savedSession = await sessionRepo.save(newSession);
            this.logger.log(`Successfully created assessment session ID: ${savedSession.id} within transaction.`);
            await queryRunner.commitTransaction();
            return savedSession;
        }
        catch (error) {
            this.logger.error(`Transaction failed during session start for user ${userId}. Rolling back. Error: ${error.message}`, error.stack);
            await queryRunner.rollbackTransaction();
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            else if (error instanceof typeorm_2.QueryFailedError) {
                throw new common_1.InternalServerErrorException(`Database error during session creation transaction: ${error.message}`);
            }
            else {
                throw new common_1.InternalServerErrorException('An unexpected error occurred while starting the assessment session transaction.');
            }
        }
        finally {
            await queryRunner.release();
            this.logger.log(`Query runner released for session start (User: ${userId})`);
        }
    }
    _shuffleArray(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]
            ];
        }
        return array;
    }
    async getNextQuestion(userId, sessionId) {
        const cacheKey = `next_question:${userId}:${sessionId}`;
        const cachedResult = await this.cacheManager.get(cacheKey);
        if (cachedResult) {
            this.logger.log(`[Service] Cache hit for getNextQuestion - session ${sessionId}`);
            return cachedResult;
        }
        this.logger.log(`[Service] Cache miss for getNextQuestion - session ${sessionId}`);
        const session = await this.sessionsRepository.findOne({
            where: { id: sessionId, user: { id: userId } },
            relations: ['responses', 'responses.question', 'skill'],
        });
        if (!session) {
            this.logger.warn(`[Service] Session not found or doesn't belong to user: ${sessionId}`);
            throw new common_1.NotFoundException('Assessment session not found.');
        }
        if (session.status === assessment_session_entity_1.AssessmentStatus.COMPLETED) {
            this.logger.log(`[Service] Session ${sessionId} is already completed. Returning completion status.`);
            const completedResult = { isComplete: true, nextQuestion: null };
            await this.cacheManager.set(cacheKey, completedResult, 3600000);
            return completedResult;
        }
        const answeredQuestionIds = session.responses.map(r => r.question.id);
        const unansweredQuestionIds = session.questionIds.filter(id => !answeredQuestionIds.includes(id));
        if (unansweredQuestionIds.length === 0) {
            this.logger.log(`[Service] All questions answered for session ${sessionId}. Marking as complete (in getNextQuestion).`);
            session.status = assessment_session_entity_1.AssessmentStatus.COMPLETED;
            session.completedAt = new Date();
            const finalScoreResult = await this.calculateOverallScore(session.id);
            session.overallScore = finalScoreResult.score;
            session.overallLevel = finalScoreResult.level;
            await this.sessionsRepository.save(session);
            await this.updateSkillScore(userId, session.skill.id, session.overallScore, session.overallLevel);
            this.logger.log(`[Service] Session ${sessionId} marked complete via getNextQuestion. Score: ${session.overallScore}, Level: ${session.overallLevel}`);
            const completedResult = { isComplete: true, nextQuestion: null };
            await this.cacheManager.set(cacheKey, completedResult, 3600000);
            return completedResult;
        }
        const nextQuestionId = unansweredQuestionIds[0];
        const nextQuestionEntity = await this.questionsRepository.findOne({
            where: { id: nextQuestionId },
            relations: ['primarySkill']
        });
        if (!nextQuestionEntity) {
            this.logger.error(`[Service] Consistency error: Next question ${nextQuestionId} not found for session ${sessionId}.`);
            throw new common_1.InternalServerErrorException(`Question ${nextQuestionId} configured for this session could not be found.`);
        }
        const nextQuestionDto = {
            id: nextQuestionEntity.id,
            questionText: nextQuestionEntity.questionText,
            type: nextQuestionEntity.questionType,
            options: nextQuestionEntity.options,
            skill: nextQuestionEntity.primarySkill,
            difficultyLevel: nextQuestionEntity.difficultyLevel,
        };
        const result = {
            isComplete: false,
            nextQuestion: nextQuestionDto,
        };
        await this.cacheManager.set(cacheKey, result, 60000);
        this.logger.log(`[Service] Returning next question ${nextQuestionDto.id} for session ${sessionId}`);
        return result;
    }
    async getSessionResult(userId, sessionId) {
        const cacheKey = `session_result:${userId}:${sessionId}`;
        const cachedResult = await this.cacheManager.get(cacheKey);
        if (cachedResult) {
            this.logger.log(`[Service] Cache hit for getSessionResult - session ${sessionId}`);
            return cachedResult;
        }
        this.logger.log(`[Service] Cache miss for getSessionResult - session ${sessionId}`);
        this.logger.log(`[Service] Getting result for session ${sessionId}, user ${userId}`);
        const session = await this.sessionsRepository.findOne({
            where: { id: sessionId, user: { id: userId } },
            relations: ['skill'],
        });
        if (!session) {
            this.logger.warn(`[Service] Session ${sessionId} not found or doesn't belong to user ${userId}`);
            throw new common_1.NotFoundException('Assessment session not found.');
        }
        if (session.status !== assessment_session_entity_1.AssessmentStatus.COMPLETED) {
            this.logger.warn(`[Service] Session ${sessionId} is not completed (status: ${session.status}). Cannot get result.`);
            throw new common_1.BadRequestException('Assessment session is not completed yet.');
        }
        const skillScore = await this.scoresRepository.findOne({
            where: {
                user: { id: userId },
                skill: { id: session.skill.id }
            },
        });
        if (!skillScore) {
            this.logger.error(`[Service] SkillScore record not found for completed session ${sessionId}, user ${userId}, skill ${session.skill.id}. Recalculating.`);
            const recalc = await this.calculateOverallScore(sessionId);
            const savedFallbackScore = await this.updateSkillScore(userId, session.skill.id, recalc.score, recalc.level);
            if (!savedFallbackScore) {
                this.logger.error(`[Service] Failed to save fallback skill score for session ${sessionId}`);
                throw new common_1.InternalServerErrorException('Could not retrieve or generate skill score.');
            }
            const result = {
                id: savedFallbackScore.id,
                userId: userId,
                skillId: session.skill.id,
                score: savedFallbackScore.score,
                level: savedFallbackScore.level,
                lastAssessedAt: savedFallbackScore.lastAssessedAt
            };
            await this.cacheManager.set(cacheKey, result, 3600000);
            return result;
        }
        const result = {
            id: skillScore.id,
            userId: userId,
            skillId: session.skill.id,
            score: skillScore.score,
            level: skillScore.level,
            lastAssessedAt: skillScore.lastAssessedAt
        };
        await this.cacheManager.set(cacheKey, result, 3600000);
        this.logger.log(`[Service] Found skill score record ${skillScore.id} for session ${sessionId}.`);
        return result;
    }
    async submitAnswer(userId, submitAnswerDto) {
        const { assessmentSessionId, questionId, userResponse } = submitAnswerDto;
        this.logger.log(`[Service] User ${userId} submitting answer for session ${assessmentSessionId}, question ${questionId}`);
        const session = await this.validateSessionAndOwnership(userId, assessmentSessionId);
        const question = await this.validateQuestionForSession(session, questionId);
        const isCorrect = this.checkAnswer(question, userResponse);
        this.logger.log(`Q ${question.id} answer isCorrect: ${isCorrect}`);
        const response = this.createResponseEntity(session, question, userResponse, isCorrect);
        try {
            const savedResponse = await this.processSubmissionWithTransaction(response, session, question, isCorrect);
            const nextQuestionCacheKey = `next_question:${userId}:${assessmentSessionId}`;
            await this.cacheManager.del(nextQuestionCacheKey);
            if (isCorrect) {
                const resultCacheKey = `session_result:${userId}:${assessmentSessionId}`;
                await this.cacheManager.del(resultCacheKey);
            }
            return this.mapToResponseDto(savedResponse);
        }
        catch (error) {
            this.logger.error(`Transaction failed during answer submission: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to process answer due to internal error.', { cause: error });
        }
    }
    async _updateSkillScoreTransactional(entityManager, session, skillId, isCorrect) {
        const scoreRepo = entityManager.getRepository(assessment_skill_score_entity_1.AssessmentSkillScore);
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
            this.logger.log(`Updating existing skill score ID ${skillScore.id}. New score: ${newScore.toFixed(2)} (${newQuestionsAttempted} attempted)`);
        }
        else {
            skillScore = scoreRepo.create({
                user: { id: session.user.id },
                skill: { id: skillId },
                score: newScore,
                questionsAttempted: newQuestionsAttempted,
            });
            this.logger.log(`Creating new skill score. Score: ${newScore.toFixed(2)} (${newQuestionsAttempted} attempted)`);
        }
        await scoreRepo.save(skillScore);
        this.logger.log(`Skill score saved successfully (transactional) for skill ${skillId}.`);
    }
    async calculateOverallScore(sessionId) {
        this.logger.log(`[Service] Calculating overall score for session ${sessionId}`);
        const session = await this.sessionsRepository.findOne({
            where: { id: sessionId },
            relations: ['responses', 'responses.question'],
        });
        if (!session) {
            this.logger.warn(`[Service] Session not found when calculating score: ${sessionId}`);
            throw new common_1.NotFoundException('Assessment session not found.');
        }
        if (!session.responses || session.responses.length === 0) {
            this.logger.warn(`[Service] No responses found for session ${sessionId} when calculating score`);
            return { score: 0, level: 0 };
        }
        const totalQuestions = session.questionIds.length;
        const correctAnswers = session.responses.filter(response => response.isCorrect).length;
        const percentageCorrect = (correctAnswers / totalQuestions) * 100;
        let level = 0;
        if (percentageCorrect >= 90) {
            level = 3;
        }
        else if (percentageCorrect >= 70) {
            level = 2;
        }
        else if (percentageCorrect >= 50) {
            level = 1;
        }
        this.logger.log(`[Service] Score calculated for session ${sessionId}: ${percentageCorrect.toFixed(2)}%, level: ${level}`);
        return {
            score: Math.round(percentageCorrect),
            level,
        };
    }
    async updateSkillScore(userId, skillId, score, level) {
        this.logger.log(`[Service] Updating skill score for user ${userId}, skill ${skillId}, score ${score}, level ${level}`);
        let skillScore = await this.scoresRepository.findOne({
            where: {
                user: { id: userId },
                skill: { id: skillId },
            },
        });
        const now = new Date();
        if (skillScore) {
            skillScore.score = score;
            skillScore.level = level;
            skillScore.lastAssessedAt = now;
            this.logger.log(`[Service] Updating existing skill score ID ${skillScore.id} for user ${userId}`);
        }
        else {
            skillScore = this.scoresRepository.create({
                user: { id: userId },
                skill: { id: skillId },
                score,
                level,
                lastAssessedAt: now,
                questionsAttempted: 0,
            });
            this.logger.log(`[Service] Creating new skill score for user ${userId}, skill ${skillId}`);
        }
        try {
            return await this.scoresRepository.save(skillScore);
        }
        catch (error) {
            this.logger.error(`[Service] Error saving skill score: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to update skill score.');
        }
    }
    async validateSessionAndOwnership(userId, sessionId) {
        this.logger.log(`[Service] Validating session ${sessionId} ownership for user ${userId}`);
        if (!userId) {
            this.logger.error('[Service] validateSessionAndOwnership called with empty userId');
            throw new common_1.UnauthorizedException('User authentication required.');
        }
        if (!sessionId) {
            this.logger.error('[Service] validateSessionAndOwnership called with empty sessionId');
            throw new common_1.BadRequestException('Assessment session ID is required.');
        }
        const session = await this.sessionsRepository.findOne({
            where: { id: sessionId },
            relations: ['user', 'skill'],
        });
        if (!session) {
            this.logger.warn(`[Service] Session ${sessionId} not found during validation`);
            throw new common_1.NotFoundException('Assessment session not found or has expired.');
        }
        if (!session.user) {
            this.logger.error(`[Service] Session ${sessionId} has no associated user`);
            throw new common_1.InternalServerErrorException('Session data is corrupted. Please contact support.');
        }
        if (session.user.id !== userId) {
            this.logger.warn(`[Service] User ${userId} attempted to access session ${sessionId} owned by ${session.user.id}`);
            throw new common_1.ForbiddenException('You do not have access to this assessment session. Please use a session created for your account.');
        }
        if (session.status === assessment_session_entity_1.AssessmentStatus.COMPLETED) {
            this.logger.warn(`[Service] User ${userId} attempted to submit answer to completed session ${sessionId}`);
            throw new common_1.BadRequestException('This assessment session is already completed. Please start a new assessment if you wish to continue.');
        }
        return session;
    }
    async validateQuestionForSession(session, questionId) {
        this.logger.debug(`Validating question ${questionId} for session ${session.id}`);
        const populatedSession = await this.sessionsRepository.findOne({
            where: { id: session.id },
            relations: ['skill'],
        });
        if (!populatedSession) {
            throw new common_1.NotFoundException(`Session ${session.id} not found`);
        }
        if (!populatedSession.questionIds || !populatedSession.questionIds.includes(questionId)) {
            throw new common_1.BadRequestException(`Question ${questionId} is not part of session ${session.id}`);
        }
        const question = await this.questionsRepository.findOne({
            where: { id: questionId },
        });
        if (!question) {
            throw new common_1.NotFoundException(`Question ${questionId} not found`);
        }
        return question;
    }
    checkAnswer(question, userResponse) {
        this.logger.log(`[Service] Checking answer for question ${question.id}, user response: ${userResponse}`);
        const correctAnswer = question.correctAnswer;
        const isCorrect = userResponse.toLowerCase() === correctAnswer.toLowerCase();
        this.logger.log(`[Service] Answer check result: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
        return isCorrect;
    }
    createResponseEntity(session, question, userResponse, isCorrect) {
        return this.responsesRepository.create({
            assessmentSession: session,
            question,
            userResponse,
            isCorrect,
            answeredAt: new Date(),
        });
    }
    async processSubmissionWithTransaction(response, session, question, isCorrect) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const responseRepo = queryRunner.manager.getRepository(assessment_response_entity_1.AssessmentResponse);
            const questionRepo = queryRunner.manager.getRepository(question_entity_1.Question);
            if (!question.primarySkill) {
                this.logger.log(`[Service] Loading primarySkill relation for question ${question.id}`);
                question = await questionRepo.findOne({
                    where: { id: question.id },
                    relations: ['primarySkill'],
                });
                if (!question || !question.primarySkill) {
                    throw new common_1.InternalServerErrorException('Failed to load question with its skill relationship.');
                }
            }
            const savedResponse = await responseRepo.save(response);
            await this._updateSkillScoreTransactional(queryRunner.manager, session, question.primarySkill.id, isCorrect);
            const sessionWithResponses = await queryRunner.manager.getRepository(assessment_session_entity_1.AssessmentSession).findOne({
                where: { id: session.id },
                relations: ['responses'],
            });
            if (sessionWithResponses.responses.length >= sessionWithResponses.questionIds.length) {
                sessionWithResponses.status = assessment_session_entity_1.AssessmentStatus.COMPLETED;
                sessionWithResponses.completedAt = new Date();
                const finalScore = await this.calculateOverallScore(session.id);
                sessionWithResponses.overallScore = finalScore.score;
                sessionWithResponses.overallLevel = finalScore.level;
                await queryRunner.manager.getRepository(assessment_session_entity_1.AssessmentSession).save(sessionWithResponses);
                this.logger.log(`[Service] Session ${session.id} marked complete. Score: ${finalScore.score}, Level: ${finalScore.level}`);
            }
            await queryRunner.commitTransaction();
            return savedResponse;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`[Service] Transaction failed during submission: ${error.message}`, error.stack);
            if (error instanceof typeorm_2.QueryFailedError) {
                throw new common_1.InternalServerErrorException('Database error occurred while processing your answer. Please try again.');
            }
            else if (error instanceof common_1.HttpException) {
                throw error;
            }
            else {
                throw new common_1.InternalServerErrorException('Failed to process your answer due to an unexpected error. Please try again later.');
            }
        }
        finally {
            await queryRunner.release();
        }
    }
    mapToResponseDto(response) {
        return {
            id: response.id,
            isCorrect: response.isCorrect,
            assessmentSession: response.assessmentSession,
            question: response.question,
            userResponse: response.userResponse,
            answeredAt: response.answeredAt,
        };
    }
    async startAssessment(userId, startAssessmentDto) {
        this.logger.log(`[Service] Attempting to start assessment for user ${userId}, skill ${startAssessmentDto.skillId}`);
        return this.startSession(userId, startAssessmentDto);
    }
};
exports.AssessmentService = AssessmentService;
exports.AssessmentService = AssessmentService = AssessmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(assessment_session_entity_1.AssessmentSession)),
    __param(2, (0, typeorm_1.InjectRepository)(assessment_response_entity_1.AssessmentResponse)),
    __param(3, (0, typeorm_1.InjectRepository)(assessment_skill_score_entity_1.AssessmentSkillScore)),
    __param(4, (0, typeorm_1.InjectRepository)(question_entity_1.Question)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(6, (0, typeorm_1.InjectRepository)(skill_entity_1.Skill)),
    __param(7, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository, Object])
], AssessmentService);
//# sourceMappingURL=assessment.service.js.map