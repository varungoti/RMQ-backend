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
var AnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const skill_entity_1 = require("./entities/skill.entity");
const assessment_session_entity_1 = require("./entities/assessment_session.entity");
const assessment_response_entity_1 = require("./entities/assessment_response.entity");
const assessment_skill_score_entity_1 = require("./entities/assessment_skill_score.entity");
let AnalyticsService = AnalyticsService_1 = class AnalyticsService {
    constructor(usersRepository, skillsRepository, sessionsRepository, responsesRepository, scoresRepository) {
        this.usersRepository = usersRepository;
        this.skillsRepository = skillsRepository;
        this.sessionsRepository = sessionsRepository;
        this.responsesRepository = responsesRepository;
        this.scoresRepository = scoresRepository;
        this.logger = new common_1.Logger(AnalyticsService_1.name);
    }
    async getUserPerformance(requestUserId, queryParams) {
        this.logger.log(`Fetching performance data for user ${queryParams.userId || requestUserId}`);
        const userId = queryParams.userId || requestUserId;
        const user = await this.usersRepository.findOneBy({ id: userId });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${userId} not found`);
        }
        if (userId !== requestUserId) {
            this.logger.warn(`User ${requestUserId} attempting to access data for another user ${userId}`);
        }
        const where = { user: { id: userId } };
        if (queryParams.startDate && queryParams.endDate) {
            where.startedAt = (0, typeorm_2.Between)(new Date(queryParams.startDate), new Date(queryParams.endDate));
        }
        else if (queryParams.startDate) {
            where.startedAt = (0, typeorm_2.Between)(new Date(queryParams.startDate), new Date());
        }
        else if (queryParams.endDate) {
            where.startedAt = (0, typeorm_2.Between)(new Date(0), new Date(queryParams.endDate));
        }
        const sessions = await this.sessionsRepository.find({
            where,
            relations: ['user'],
            order: { startedAt: 'DESC' },
        });
        const sessionIds = sessions.map(session => session.id);
        let responses = [];
        if (sessionIds.length > 0) {
            responses = await this.responsesRepository.find({
                where: { assessmentSession: { id: (0, typeorm_2.In)(sessionIds) } },
                relations: ['assessmentSession', 'question', 'question.primarySkill'],
            });
        }
        const skillScores = await this.scoresRepository.find({
            where: { user: { id: userId } },
            relations: ['skill', 'user'],
        });
        const skillPerformance = await this.calculateSkillPerformance(skillScores, responses, queryParams.skillId);
        const assessmentCount = sessions.length;
        const completedAssessments = sessions.filter(s => s.status === assessment_session_entity_1.AssessmentStatus.COMPLETED);
        const correctResponses = responses.filter(r => r.isCorrect).length;
        const totalResponses = responses.length;
        const overallScore = totalResponses > 0 ? (correctResponses / totalResponses) * 100 : 0;
        const recentAssessments = sessions.slice(0, 5).map(session => {
            const sessionResponses = responses.filter(r => r.assessmentSession.id === session.id);
            const answered = sessionResponses.length;
            const correct = sessionResponses.filter(r => r.isCorrect).length;
            return {
                id: session.id,
                startedAt: session.startedAt,
                completedAt: session.completedAt,
                status: session.status,
                totalQuestions: session.questionIds.length,
                answeredQuestions: answered,
                correctAnswers: correct,
                percentageCorrect: answered > 0 ? (correct / answered) * 100 : 0,
            };
        });
        return {
            userId: user.id,
            username: user.email.split('@')[0],
            email: user.email,
            gradeLevel: user.gradeLevel,
            overallScore,
            assessmentCount,
            skillPerformance,
            recentAssessments,
        };
    }
    async calculateSkillPerformance(skillScores, responses, filterSkillId) {
        const scoresBySkill = new Map();
        skillScores.forEach(score => {
            const skillId = score.skill.id;
            if (!scoresBySkill.has(skillId)) {
                scoresBySkill.set(skillId, []);
            }
            scoresBySkill.get(skillId).push(score);
        });
        const skillIds = filterSkillId ? [filterSkillId] : Array.from(scoresBySkill.keys());
        const skillPerformance = [];
        for (const skillId of skillIds) {
            if (filterSkillId && skillId !== filterSkillId)
                continue;
            if (!scoresBySkill.has(skillId))
                continue;
            const skillScoreArr = scoresBySkill.get(skillId);
            const skill = await this.skillsRepository.findOneBy({ id: skillId });
            if (!skill) {
                this.logger.warn(`Skill ${skillId} not found during performance calculation`);
                continue;
            }
            skillScoreArr.sort((a, b) => b.lastAssessedAt.getTime() - a.lastAssessedAt.getTime());
            const latestScore = skillScoreArr[0];
            const skillResponses = responses.filter(r => r.question.primarySkill && r.question.primarySkill.id === skillId);
            const correctAnswers = skillResponses.filter(r => r.isCorrect).length;
            const incorrectAnswers = skillResponses.length - correctAnswers;
            const lastAttemptDate = skillResponses.length > 0
                ? skillResponses.reduce((latest, current) => latest.answeredAt > current.answeredAt ? latest : current).answeredAt
                : latestScore.lastAssessedAt;
            skillPerformance.push({
                skillId: skill.id,
                skillName: skill.name,
                score: latestScore.score,
                questionsAttempted: skillResponses.length,
                correctAnswers,
                incorrectAnswers,
                lastAttemptDate,
            });
        }
        return skillPerformance;
    }
    async getClassPerformance(gradeLevel) {
        this.logger.log(`Fetching class performance data for grade ${gradeLevel}`);
        return {
            gradeLevel,
            studentCount: 0,
            averageScore: 0,
            skillBreakdown: [],
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = AnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(skill_entity_1.Skill)),
    __param(2, (0, typeorm_1.InjectRepository)(assessment_session_entity_1.AssessmentSession)),
    __param(3, (0, typeorm_1.InjectRepository)(assessment_response_entity_1.AssessmentResponse)),
    __param(4, (0, typeorm_1.InjectRepository)(assessment_skill_score_entity_1.AssessmentSkillScore)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map