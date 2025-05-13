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
const assessment_session_entity_1 = require("../entities/assessment_session.entity");
const assessment_response_entity_1 = require("../entities/assessment_response.entity");
const question_entity_1 = require("../entities/question.entity");
const skill_entity_1 = require("../entities/skill.entity");
const assessment_skill_score_entity_1 = require("../entities/assessment_skill_score.entity");
const user_entity_1 = require("../entities/user.entity");
const assessment_dto_1 = require("../dto/assessment.dto");
const answer_checker_factory_1 = require("./factories/answer-checker.factory");
let AssessmentService = AssessmentService_1 = class AssessmentService {
    constructor(sessionRepository, responseRepository, questionRepository, skillRepository, scoreRepository, dataSource, userRepository, answerCheckerFactory) {
        this.sessionRepository = sessionRepository;
        this.responseRepository = responseRepository;
        this.questionRepository = questionRepository;
        this.skillRepository = skillRepository;
        this.scoreRepository = scoreRepository;
        this.dataSource = dataSource;
        this.userRepository = userRepository;
        this.answerCheckerFactory = answerCheckerFactory;
        this.logger = new common_1.Logger(AssessmentService_1.name);
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
            return this.mapToResponseDto(savedResponse);
        }
        catch (error) {
            this.logger.error(`Transaction failed during answer submission: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to process answer due to internal error.', { cause: error });
        }
    }
    async validateSessionAndOwnership(userId, sessionId) {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId, user: { id: userId } },
            relations: ['skill', 'user'],
        });
        if (!session) {
            this.logger.error(`[Service] Session ${sessionId} not found for submitAnswer`);
            throw new common_1.NotFoundException(`Assessment session ${sessionId} not found.`);
        }
        if (session.user.id !== userId) {
            this.logger.error(`[Service] User ${userId} forbidden from accessing session ${sessionId} owned by ${session.user.id}`);
            throw new common_1.ForbiddenException('You do not own this assessment session.');
        }
        if (session.status !== assessment_session_entity_1.AssessmentStatus.IN_PROGRESS) {
            this.logger.error(`[Service] Attempt to submit answer for non-active session ${sessionId} (status: ${session.status})`);
            throw new common_1.BadRequestException('This assessment session is not in progress.');
        }
        return session;
    }
    async validateQuestionForSession(session, questionId) {
        this.logger.log(`[Service] Validating question ${questionId} for session ${session.id}`);
        if (!questionId) {
            this.logger.error('[Service] validateQuestionForSession called with empty questionId');
            throw new common_1.BadRequestException('Question ID is required.');
        }
        if (!session.questionIds.includes(questionId)) {
            this.logger.warn(`[Service] Question ${questionId} not found in session ${session.id}'s questionIds`);
            throw new common_1.NotFoundException('Question not found in this assessment session. Please use a valid question from the current assessment.');
        }
        const question = await this.questionRepository.findOne({
            where: { id: questionId },
            relations: ['primarySkill'],
        });
        if (!question) {
            this.logger.error(`[Service] Question ${questionId} not found in database`);
            throw new common_1.NotFoundException('Question not found. Please try a different question.');
        }
        const isAnswered = await this.responseRepository.findOne({
            where: {
                assessmentSession: { id: session.id },
                question: { id: questionId },
            },
        });
        if (isAnswered) {
            this.logger.warn(`[Service] Question ${questionId} already answered in session ${session.id}`);
            throw new common_1.BadRequestException('This question has already been answered. Please proceed to the next question.');
        }
        return question;
    }
    createResponseEntity(session, question, userResponse, isCorrect) {
        return this.responseRepository.create({
            assessmentSession: session,
            question: question,
            userResponse: userResponse,
            isCorrect: isCorrect,
            answeredAt: new Date(),
        });
    }
    async processSubmissionWithTransaction(response, session, question, isCorrect) {
        let savedResponse = null;
        await this.dataSource.transaction(async (transactionalEntityManager) => {
            this.logger.log(`Saving response for Q ${question.id}, Session ${session.id}`);
            savedResponse = await transactionalEntityManager.save(assessment_response_entity_1.AssessmentResponse, response);
            this.logger.log(`Response saved with ID: ${savedResponse?.id}`);
            if (session.skill) {
                this.logger.log(`Updating skill score for Skill ${session.skill?.id}, Session ${session.id}`);
                await this._updateSkillScoreTransactional(transactionalEntityManager, session, question, isCorrect);
            }
            else {
                this.logger.warn(`Skill not found on session ${session.id}, skipping score update.`);
            }
            await this.updateSessionStatusIfComplete(transactionalEntityManager, session);
        });
        if (!savedResponse?.id) {
            this.logger.error(`Saved response ID is null after transaction for session ${session.id}`);
            throw new common_1.InternalServerErrorException('Failed to retrieve saved response ID after transaction.');
        }
        const fetchedResponse = await this.responseRepository.findOne({
            where: { id: savedResponse.id },
            relations: ['assessmentSession', 'question', 'question.primarySkill'],
        });
        if (!fetchedResponse) {
            this.logger.error(`Failed to refetch response with ID: ${savedResponse.id} after commit.`);
            throw new common_1.InternalServerErrorException('Could not retrieve the response details after saving.');
        }
        return fetchedResponse;
    }
    async updateSessionStatusIfComplete(entityManager, session) {
        const responseCount = await entityManager.count(assessment_response_entity_1.AssessmentResponse, {
            where: { assessmentSession: { id: session.id } },
        });
        this.logger.log(`Session ${session.id} response count: ${responseCount} / ${session.questionIds.length}`);
        if (responseCount >= session.questionIds.length) {
            this.logger.log(`Session ${session.id} is complete, updating status.`);
            session.status = assessment_session_entity_1.AssessmentStatus.COMPLETED;
            session.completedAt = new Date();
            await entityManager.save(assessment_session_entity_1.AssessmentSession, session);
            this.logger.log(`Session ${session.id} status updated to COMPLETED.`);
        }
    }
    mapToResponseDto(response) {
        const responseDto = new assessment_dto_1.AssessmentResponseDto();
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
            options: response.question.options,
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
    checkAnswer(question, userResponse) {
        this.logger.log(`[Service] Checking answer for question ${question.id} of type ${question.questionType}`);
        try {
            const isCorrect = this.answerCheckerFactory.checkAnswer(question, userResponse);
            this.logger.log(`[Service] Answer check result: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
            return isCorrect;
        }
        catch (error) {
            this.logger.error(`Error during answer checking: ${error.message}`, error.stack);
            this.logger.warn('Falling back to simple string comparison');
            return question.correctAnswer.toLowerCase() === userResponse.toLowerCase();
        }
    }
    async _updateSkillScoreTransactional(entityManager, session, question, isCorrect) {
        this.logger.debug(`Updating score for session ${session.id}, skill ${session.skill.id}, Q ${question.id}`);
        let skillScore = await entityManager.findOne(assessment_skill_score_entity_1.AssessmentSkillScore, {
            where: { user: { id: session.user.id }, skill: { id: session.skill.id } }
        });
        if (!skillScore) {
            this.logger.log(`No existing score found for session ${session.id}, skill ${session.skill.id}. Creating new.`);
            skillScore = entityManager.create(assessment_skill_score_entity_1.AssessmentSkillScore, {
                user: { id: session.user.id },
                skill: session.skill,
                score: 0,
                questionsAttempted: 0,
                level: 0,
            });
        }
        this.logger.log(`[SCORE CALC START] Raw skillScore.score - Type: ${typeof skillScore.score}, Value: ${skillScore.score}`);
        let currentScore = Number(skillScore.score ?? 0);
        let difficulty = Number(question.difficultyLevel || 100);
        const scoreDelta = isCorrect ? difficulty : 0;
        if (isNaN(difficulty)) {
            this.logger.warn(`Question ${question.id} has invalid difficultyLevel: ${question.difficultyLevel}. Using default delta 100 if correct.`);
            difficulty = 100;
        }
        let newScore = currentScore + (isCorrect ? difficulty : 0);
        if (isNaN(newScore)) {
            this.logger.error(`Calculated newScore is NaN for session ${session.id}, Q ${question.id}. currentScore=${currentScore}, difficulty=${difficulty}, isCorrect=${isCorrect}. Keeping original score.`);
            newScore = currentScore;
        }
        this.logger.log(`[SCORE ASSIGNMENT] Type: ${typeof newScore}, Value: ${newScore}`);
        skillScore.score = newScore;
        skillScore.questionsAttempted = (skillScore.questionsAttempted ?? 0) + 1;
        this.logger.debug(`Saving updated score for session ${session.id}: Score ${skillScore.score}, Attempted ${skillScore.questionsAttempted}`);
        await entityManager.save(assessment_skill_score_entity_1.AssessmentSkillScore, skillScore);
    }
    async startAssessment(userId, startAssessmentDto) {
        this.logger.log(`[Service] Attempting to start assessment for user ${userId}, skill ${startAssessmentDto.skillId}`);
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            this.logger.error(`[Service] User not found for ID: ${userId} in startAssessment`);
            throw new common_1.NotFoundException(`User with ID ${userId} not found.`);
        }
        const skill = await this.skillRepository.findOneBy({ id: startAssessmentDto.skillId, status: skill_entity_1.SkillStatus.ACTIVE });
        if (!skill) {
            this.logger.error(`[Service] Active skill not found for ID: ${startAssessmentDto.skillId} in startAssessment`);
            throw new common_1.NotFoundException(`Active skill with ID ${startAssessmentDto.skillId} not found.`);
        }
        const questions = await this.questionRepository.find({
            where: {
                primarySkill: { id: skill.id },
                gradeLevel: user.gradeLevel,
                status: question_entity_1.QuestionStatus.ACTIVE,
            },
            take: 10,
        });
        if (questions.length === 0) {
            this.logger.error(`[Service] No active questions found for skill ${skill.id} at grade level ${user.gradeLevel}`);
            throw new common_1.NotFoundException(`No active questions found for skill ${skill.id} at grade level ${user.gradeLevel}`);
        }
        const questionIds = questions.map(q => q.id);
        for (let i = questionIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questionIds[i], questionIds[j]] = [questionIds[j], questionIds[i]];
        }
        const newSession = this.sessionRepository.create({
            user: user,
            skill: skill,
            status: assessment_session_entity_1.AssessmentStatus.IN_PROGRESS,
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
    async getNextQuestion(userId, sessionId) {
        this.logger.log(`[Service] Getting next question for user ${userId}, session ${sessionId}`);
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId, user: { id: userId } },
            relations: ['responses', 'responses.question', 'skill'],
        });
        if (!session) {
            this.logger.warn(`[Service] Session not found or doesn't belong to user: ${sessionId}`);
            throw new common_1.NotFoundException('Assessment session not found.');
        }
        if (session.status === assessment_session_entity_1.AssessmentStatus.COMPLETED) {
            this.logger.log(`[Service] Session ${sessionId} is already completed. Returning completion status.`);
            return { isComplete: true, nextQuestion: null };
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
            await this.sessionRepository.save(session);
            await this.updateSkillScore(userId, session.skill.id, session.overallScore, session.overallLevel);
            this.logger.log(`[Service] Session ${sessionId} marked complete via getNextQuestion. Score: ${session.overallScore}, Level: ${session.overallLevel}`);
            return { isComplete: true, nextQuestion: null };
        }
        const nextQuestionId = unansweredQuestionIds[0];
        const nextQuestionEntity = await this.questionRepository.findOne({
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
        this.logger.log(`[Service] Returning next question ${nextQuestionDto.id} for session ${sessionId}`);
        return {
            isComplete: false,
            nextQuestion: nextQuestionDto,
        };
    }
    async calculateOverallScore(sessionId) {
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
    determineLevel(scorePercentage) {
        if (scorePercentage >= 90)
            return 5;
        if (scorePercentage >= 75)
            return 4;
        if (scorePercentage >= 60)
            return 3;
        if (scorePercentage >= 40)
            return 2;
        return 1;
    }
    async updateSkillScore(userId, skillId, score, level) {
        this.logger.log(`[Service] Updating skill score for user ${userId}, skill ${skillId}. Score: ${score}, Level: ${level}`);
        let skillScore = await this.scoreRepository.findOne({
            where: {
                user: { id: userId },
                skill: { id: skillId }
            },
            relations: ['user', 'skill'],
        });
        const now = new Date();
        if (skillScore) {
            skillScore.score = score;
            skillScore.level = level;
            skillScore.lastAssessedAt = now;
            this.logger.log(`[Service] Updating existing skill score record ${skillScore.id}`);
        }
        else {
            this.logger.log(`[Service] Creating new skill score record for user ${userId}, skill ${skillId}`);
            skillScore = this.scoreRepository.create({
                user: { id: userId },
                skill: { id: skillId },
                score: score,
                level: level,
                lastAssessedAt: now,
            });
        }
        try {
            const savedScore = await this.scoreRepository.save(skillScore);
            this.logger.log(`[Service] Skill score saved/updated successfully. Record ID: ${savedScore.id}`);
            return savedScore;
        }
        catch (error) {
            this.logger.error(`[Service] Error saving skill score for user ${userId}, skill ${skillId}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Could not save skill score.');
        }
    }
    async getSessionResult(userId, sessionId) {
        this.logger.log(`[Service] Getting result for session ${sessionId}, user ${userId}`);
        const session = await this.sessionRepository.findOne({
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
        const skillScore = await this.scoreRepository.findOne({
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
};
exports.AssessmentService = AssessmentService;
exports.AssessmentService = AssessmentService = AssessmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(assessment_session_entity_1.AssessmentSession)),
    __param(1, (0, typeorm_1.InjectRepository)(assessment_response_entity_1.AssessmentResponse)),
    __param(2, (0, typeorm_1.InjectRepository)(question_entity_1.Question)),
    __param(3, (0, typeorm_1.InjectRepository)(skill_entity_1.Skill)),
    __param(4, (0, typeorm_1.InjectRepository)(assessment_skill_score_entity_1.AssessmentSkillScore)),
    __param(6, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        typeorm_2.Repository,
        answer_checker_factory_1.AnswerCheckerFactory])
], AssessmentService);
//# sourceMappingURL=assessment.service.js.map