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
var RecommendationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const skill_entity_1 = require("./entities/skill.entity");
const assessment_skill_score_entity_1 = require("./entities/assessment_skill_score.entity");
const assessment_session_entity_1 = require("./entities/assessment_session.entity");
const assessment_response_entity_1 = require("./entities/assessment_response.entity");
const recommendation_resource_entity_1 = require("./entities/recommendation_resource.entity");
const recommendation_history_entity_1 = require("./entities/recommendation_history.entity");
const recommendation_feedback_entity_1 = require("./entities/recommendation_feedback.entity");
const recommendation_dto_1 = require("./dto/recommendation.dto");
const config_1 = require("@nestjs/config");
const ai_recommendation_service_1 = require("./ai-recommendation.service");
const redis_service_1 = require("./redis.service");
const feedback_validation_service_1 = require("./services/feedback-validation.service");
const feedback_analysis_service_1 = require("./services/feedback-analysis.service");
let RecommendationsService = RecommendationsService_1 = class RecommendationsService {
    constructor(usersRepository, skillsRepository, scoresRepository, sessionsRepository, responsesRepository, resourcesRepository, historyRepository, feedbackRepository, configService, aiRecommendationService, redisService, feedbackValidation, feedbackAnalysis) {
        this.usersRepository = usersRepository;
        this.skillsRepository = skillsRepository;
        this.scoresRepository = scoresRepository;
        this.sessionsRepository = sessionsRepository;
        this.responsesRepository = responsesRepository;
        this.resourcesRepository = resourcesRepository;
        this.historyRepository = historyRepository;
        this.feedbackRepository = feedbackRepository;
        this.configService = configService;
        this.aiRecommendationService = aiRecommendationService;
        this.redisService = redisService;
        this.feedbackValidation = feedbackValidation;
        this.feedbackAnalysis = feedbackAnalysis;
        this.logger = new common_1.Logger(RecommendationsService_1.name);
        this.SKILL_THRESHOLD_LOW = 550;
        this.SKILL_THRESHOLD_CRITICAL = 450;
        this.MAX_RECOMMENDATIONS = 5;
        this.RESOURCE_COOLDOWN_DAYS = 30;
        this.MAX_AI_RESOURCES_PER_SKILL = 10;
        this.AI_RESOURCE_CLEANUP_THRESHOLD = 90;
        this.AI_CACHE_TTL = 24 * 60 * 60 * 1000;
        this.AI_RETRY_ATTEMPTS = 3;
        this.AI_RETRY_DELAY = 1000;
        this.AI_METRICS = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            cacheHits: 0,
            cacheMisses: 0,
            averageResponseTime: 0,
            totalResponseTime: 0,
            errorsByType: new Map(),
            recentErrors: [],
            maxRecentErrors: 100,
        };
    }
    async getRecommendations(userId, queryParams = {}) {
        this.logger.log(`Generating recommendations for user ${userId} with query: ${JSON.stringify(queryParams)}`);
        const user = await this.usersRepository.findOneBy({ id: userId });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${userId} not found`);
        }
        const gapsToAddress = await this._getGapsToAddress(userId, queryParams);
        const limit = queryParams.limit || this.MAX_RECOMMENDATIONS;
        const selectedGaps = gapsToAddress.slice(0, limit);
        const validRecommendations = await this._generateRecommendationsForGaps(user, selectedGaps, queryParams);
        const latestScoreBySkill = await this._getLatestSkillScores(userId);
        const { summary, overallProgress } = this._createRecommendationSummary(validRecommendations, latestScoreBySkill);
        this.logger.log(`Generated ${validRecommendations.length} recommendations for user ${userId}`);
        return {
            userId: userId,
            generatedAt: new Date(),
            recommendations: validRecommendations,
            overallProgress: overallProgress,
            summary: summary,
        };
    }
    async _getLatestSkillScores(userId) {
        const skillScores = await this.scoresRepository.find({
            where: { user: { id: userId } },
            relations: ['skill', 'user'],
            order: { lastAssessedAt: 'DESC' },
        });
        const latestScoreBySkill = new Map();
        skillScores.forEach(score => {
            if (!score.skill)
                return;
            const skillId = score.skill.id;
            if (!latestScoreBySkill.has(skillId) ||
                score.lastAssessedAt > latestScoreBySkill.get(skillId).lastAssessedAt) {
                latestScoreBySkill.set(skillId, score);
            }
        });
        return latestScoreBySkill;
    }
    _identifySkillGaps(latestScores, filterSkillId) {
        const skillGaps = [];
        for (const [skillId, score] of latestScores.entries()) {
            if (filterSkillId && skillId !== filterSkillId) {
                continue;
            }
            if (score.score < this.SKILL_THRESHOLD_LOW) {
                skillGaps.push({
                    skillId,
                    score: score.score,
                    skill: score.skill
                });
            }
        }
        skillGaps.sort((a, b) => a.score - b.score);
        return skillGaps;
    }
    async _getSpecificSkillData(skillId, latestScores) {
        const specifiedSkill = await this.skillsRepository.findOneBy({ id: skillId });
        if (!specifiedSkill) {
            this.logger.warn(`Requested skill ${skillId} not found.`);
            return null;
        }
        const score = latestScores.get(skillId);
        return {
            skillId: skillId,
            score: score ? score.score : 500,
            skill: specifiedSkill
        };
    }
    async _generateSingleRecommendation(user, gap, queryParams) {
        let recommendation = null;
        const useAi = gap.score < this.SKILL_THRESHOLD_CRITICAL || queryParams.type === recommendation_dto_1.RecommendationType.PERSONALIZED;
        if (useAi && this.aiRecommendationService.isEnabled()) {
            recommendation = await this._tryGenerateAiRecommendation(user, gap);
        }
        if (!recommendation) {
            recommendation = await this._findStandardRecommendation(user, gap, queryParams.type);
        }
        return recommendation;
    }
    async _tryGenerateAiRecommendation(user, gap) {
        this.logger.log(`Attempting AI recommendation for user ${user.id}, skill ${gap.skillId}`);
        const existingAiResource = await this.resourcesRepository.findOne({
            where: {
                relatedSkills: { id: gap.skillId },
                isAiGenerated: true,
            },
            order: { createdAt: 'DESC' },
            relations: ['relatedSkills'],
        });
        if (existingAiResource) {
            this.logger.log(`Reusing existing AI resource ${existingAiResource.id} for skill ${gap.skillId}`);
            const { priority, explanation } = this._determinePriorityAndExplanation(gap);
            const recommendationDto = {
                id: `ai-reuse-${existingAiResource.id}`,
                skillId: gap.skillId,
                skillName: gap.skill.name,
                priority: priority,
                score: gap.score,
                targetScore: this.SKILL_THRESHOLD_LOW + 50,
                explanation: explanation,
                aiGenerated: true,
                resources: [{
                        id: existingAiResource.id,
                        title: existingAiResource.title,
                        description: existingAiResource.description,
                        url: existingAiResource.url,
                        type: existingAiResource.type,
                        estimatedTimeMinutes: existingAiResource.estimatedTimeMinutes,
                        tags: existingAiResource.tags || [],
                    }],
            };
            await this.saveRecommendationToHistory(user, gap.skill, existingAiResource, recommendationDto);
            return recommendationDto;
        }
        else {
            this.logger.log(`No suitable existing AI resource found for skill ${gap.skillId}. Generating new one.`);
            try {
                const history = await this._getUserAssessmentHistoryForSkill(user.id, gap.skillId);
                const aiRecommendation = await this.aiRecommendationService.generateRecommendation(user.id, gap.skill, gap.score, history);
                if (!aiRecommendation) {
                    this.logger.warn(`AI generation failed or returned null for skill ${gap.skillId}.`);
                    return null;
                }
                const newAiResource = this.resourcesRepository.create({
                    title: aiRecommendation.resourceTitle,
                    description: aiRecommendation.resourceDescription,
                    url: aiRecommendation.resourceUrl,
                    type: aiRecommendation.resourceType,
                    estimatedTimeMinutes: 15,
                    gradeLevel: user.gradeLevel,
                    tags: ['ai-generated', gap.skill.name],
                    relatedSkills: [gap.skill],
                    isAiGenerated: true,
                });
                const savedNewResource = await this.resourcesRepository.save(newAiResource);
                this.logger.log(`Saved new AI-generated resource ${savedNewResource.id}`);
                const recommendationDto = {
                    id: `ai-new-${savedNewResource.id}`,
                    skillId: gap.skillId,
                    skillName: gap.skill.name,
                    priority: aiRecommendation.priority,
                    score: gap.score,
                    targetScore: 650,
                    explanation: aiRecommendation.explanation,
                    aiGenerated: true,
                    resources: [{
                            id: savedNewResource.id,
                            title: savedNewResource.title,
                            description: savedNewResource.description,
                            url: savedNewResource.url,
                            type: savedNewResource.type,
                            estimatedTimeMinutes: savedNewResource.estimatedTimeMinutes,
                            tags: savedNewResource.tags || [],
                        }],
                };
                await this.saveRecommendationToHistory(user, gap.skill, savedNewResource, recommendationDto);
                return recommendationDto;
            }
            catch (error) {
                this.logger.error(`Failed during *new* AI recommendation generation/saving for skill ${gap.skillId}: ${error.message}`, error.stack);
                return null;
            }
        }
    }
    async _findStandardRecommendation(user, gap, requestedType) {
        this.logger.log(`Finding standard recommendation(s) for user ${user.id}, skill ${gap.skillId}`);
        try {
            const [completedHistory, recentHistory] = await Promise.all([
                this.historyRepository.find({
                    where: {
                        user: { id: user.id },
                        skill: { id: gap.skillId },
                        isCompleted: true,
                    },
                    relations: ['resource'],
                    select: ['resource'],
                }),
                this.historyRepository.find({
                    where: {
                        user: { id: user.id },
                        skill: { id: gap.skillId },
                        createdAt: (0, typeorm_2.MoreThan)(new Date(Date.now() - this.RESOURCE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000)),
                    },
                    relations: ['resource'],
                    select: ['resource'],
                }),
            ]);
            const excludedResourceIds = new Set([
                ...completedHistory.map(h => h.resource?.id).filter((id) => !!id),
                ...recentHistory.map(h => h.resource?.id).filter((id) => !!id),
            ]);
            const whereClause = {
                relatedSkills: { id: gap.skillId },
                gradeLevel: user.gradeLevel,
                isAiGenerated: false,
            };
            if (requestedType && requestedType !== recommendation_dto_1.RecommendationType.PERSONALIZED) {
                whereClause.type = requestedType;
            }
            if (excludedResourceIds.size > 0) {
                whereClause.id = (0, typeorm_2.Not)((0, typeorm_2.In)(Array.from(excludedResourceIds)));
            }
            const MAX_STANDARD_OPTIONS = 10;
            const potentialResources = await this.resourcesRepository.find({
                where: whereClause,
                relations: ['relatedSkills'],
                order: { createdAt: 'DESC' },
                take: MAX_STANDARD_OPTIONS,
            });
            if (potentialResources.length === 0) {
                this.logger.warn(`No suitable standard resources found for skill ${gap.skillId}, grade ${user.gradeLevel}`);
                return null;
            }
            const scoredResources = await Promise.all(potentialResources.map(async (resource) => {
                const score = await this._calculateResourceScore(resource, user, gap);
                return { resource, score };
            }));
            const topResources = scoredResources
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)
                .map(({ resource }) => resource);
            const selectedResource = this._selectBestResourceForSkillLevel(topResources, gap.score);
            if (!selectedResource) {
                return null;
            }
            return this._createRecommendationDto(selectedResource, gap);
        }
        catch (error) {
            this.logger.error(`Error finding standard recommendation: ${error.message}`, error.stack);
            return null;
        }
    }
    async _calculateResourceScore(resource, user, gap) {
        let score = 0;
        const effectiveness = await this._getResourceEffectiveness(resource.id);
        score += effectiveness * 0.4;
        const difficultyMatch = this._calculateDifficultyMatch(resource, gap.score);
        score += difficultyMatch * 0.3;
        const recencyBonus = this._calculateRecencyBonus(resource.createdAt);
        score += recencyBonus * 0.2;
        const preferenceBonus = await this._getUserPreferenceBonus(user.id, resource.type);
        score += preferenceBonus * 0.1;
        return score;
    }
    async _getResourceEffectiveness(resourceId) {
        const history = await this.historyRepository.find({
            where: { resource: { id: resourceId } },
            relations: ['user', 'skill'],
        });
        if (history.length === 0)
            return 0.5;
        const completedCount = history.filter(h => h.isCompleted).length;
        const totalCount = history.length;
        const completionRate = completedCount / totalCount;
        const skillImprovements = await Promise.all(history.map(async (h) => {
            const beforeScore = await this._getUserSkillScoreBefore(h.user.id, h.skill.id, h.createdAt);
            const afterScore = await this._getUserSkillScoreAfter(h.user.id, h.skill.id, h.createdAt);
            return afterScore - beforeScore;
        }));
        const avgImprovement = skillImprovements.reduce((a, b) => a + b, 0) / skillImprovements.length;
        const normalizedImprovement = Math.min(Math.max(avgImprovement / 100, 0), 1);
        return (completionRate * 0.6 + normalizedImprovement * 0.4);
    }
    _calculateDifficultyMatch(resource, userScore) {
        const difficulty = resource.gradeLevel * 100;
        const scoreDiff = Math.abs(difficulty - userScore);
        return Math.max(0, 1 - scoreDiff / 500);
    }
    _calculateRecencyBonus(createdAt) {
        const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return Math.max(0, 1 - ageInDays / 365);
    }
    async _getUserPreferenceBonus(userId, resourceType) {
        const history = await this.historyRepository.find({
            where: { user: { id: userId } },
            relations: ['resource'],
        });
        if (history.length === 0)
            return 0.5;
        const typeHistory = history.filter(h => h.resource.type === resourceType);
        const completionRate = typeHistory.filter(h => h.isCompleted).length / typeHistory.length;
        return completionRate;
    }
    _selectBestResourceForSkillLevel(resources, userScore) {
        if (resources.length === 0)
            return null;
        return resources.sort((a, b) => {
            const aDiff = Math.abs(a.gradeLevel * 100 - userScore);
            const bDiff = Math.abs(b.gradeLevel * 100 - userScore);
            return aDiff - bDiff;
        })[0];
    }
    async _cleanupAiResources() {
        const cutoffDate = new Date(Date.now() - this.AI_RESOURCE_CLEANUP_THRESHOLD * 24 * 60 * 60 * 1000);
        const unusedResources = await this.resourcesRepository.find({
            where: {
                isAiGenerated: true,
                createdAt: (0, typeorm_2.LessThan)(cutoffDate),
            },
            relations: ['relatedSkills'],
        });
        const resourcesBySkill = new Map();
        unusedResources.forEach(resource => {
            resource.relatedSkills.forEach(skill => {
                if (!resourcesBySkill.has(skill.id)) {
                    resourcesBySkill.set(skill.id, []);
                }
                resourcesBySkill.get(skill.id).push(resource);
            });
        });
        for (const [skillId, resources] of resourcesBySkill) {
            const totalResources = await this.resourcesRepository.count({
                where: {
                    relatedSkills: { id: skillId },
                    isAiGenerated: true,
                },
            });
            if (totalResources > this.MAX_AI_RESOURCES_PER_SKILL) {
                const toDelete = resources
                    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                    .slice(0, totalResources - this.MAX_AI_RESOURCES_PER_SKILL);
                await this.resourcesRepository.remove(toDelete);
                this.logger.log(`Cleaned up ${toDelete.length} unused AI resources for skill ${skillId}`);
            }
        }
    }
    _determinePriorityAndExplanation(gap) {
        let priority = recommendation_dto_1.RecommendationPriority.MEDIUM;
        let explanation = `Practice ${gap.skill.name} to improve your understanding.`;
        if (gap.score < this.SKILL_THRESHOLD_CRITICAL) {
            priority = recommendation_dto_1.RecommendationPriority.CRITICAL;
            explanation = `You seem to be struggling with ${gap.skill.name}. Focus on this area to build a stronger foundation.`;
        }
        else if (gap.score < this.SKILL_THRESHOLD_LOW) {
            priority = recommendation_dto_1.RecommendationPriority.HIGH;
            explanation = `Improving your skills in ${gap.skill.name} is recommended. This resource can help.`;
        }
        return { priority, explanation };
    }
    async _getUserAssessmentHistoryForSkill(userId, skillId) {
        this.logger.log(`Fetching assessment history for user ${userId}, skill ${skillId}`);
        const responses = await this.responsesRepository.find({
            where: {
                assessmentSession: { user: { id: userId } },
                question: { primarySkill: { id: skillId } }
            },
            relations: ['question', 'question.primarySkill', 'assessmentSession', 'assessmentSession.user'],
            order: { answeredAt: 'DESC' },
            take: 10,
        });
        return responses.map(response => ({
            skillId: skillId,
            isCorrect: response.isCorrect,
            date: response.answeredAt,
        }));
    }
    async _getLatestScoreForSkill(userId, skillId) {
        this.logger.log(`Fetching latest score for skill ${skillId} for user ${userId}`);
        const latestScoreRecord = await this.scoresRepository.findOne({
            where: {
                user: { id: userId },
                skill: { id: skillId },
            },
            order: { lastAssessedAt: 'DESC' },
            relations: ['skill', 'user'],
        });
        if (!latestScoreRecord) {
            this.logger.warn(`No score found for skill ${skillId} for user ${userId}`);
        }
        return latestScoreRecord;
    }
    async saveRecommendationToHistory(user, skill, resource, recommendation) {
        try {
            const historyEntry = this.historyRepository.create({
                user: user,
                skill: skill,
                resource: resource,
                priority: recommendation.priority,
                explanation: recommendation.explanation,
                userScore: recommendation.score,
                targetScore: recommendation.targetScore,
                isAiGenerated: recommendation.aiGenerated,
                isCompleted: false,
            });
            const savedEntry = await this.historyRepository.save(historyEntry);
            this.logger.log(`Saved recommendation (History ID: ${savedEntry.id}, Resource ID: ${resource.id}) to history for user ${user.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to save recommendation (Resource ID: ${resource.id}) to history for user ${user.id}: ${error.message}`, error.stack);
        }
    }
    async markRecommendationCompleted(userId, recommendationId, wasHelpful) {
        this.logger.log(`User ${userId} marking recommendation history ${recommendationId} as completed (helpful: ${wasHelpful})`);
        const historyEntry = await this.historyRepository.findOne({
            where: { id: recommendationId, user: { id: userId } },
            relations: ['user']
        });
        if (!historyEntry) {
            throw new common_1.NotFoundException(`Recommendation history entry with ID ${recommendationId} not found for this user.`);
        }
        if (historyEntry.isCompleted) {
            this.logger.warn(`Recommendation history ${recommendationId} was already marked completed.`);
            return { success: true };
        }
        historyEntry.isCompleted = true;
        historyEntry.completedAt = new Date();
        historyEntry.wasHelpful = wasHelpful;
        try {
            await this.historyRepository.save(historyEntry);
            this.logger.log(`Marked recommendation history ${recommendationId} as completed.`);
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Failed to update recommendation history ${recommendationId}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to mark recommendation as completed.');
        }
    }
    async getRecommendationResources(type, gradeLevel) {
        const where = {};
        if (type) {
            where.type = type;
        }
        if (gradeLevel) {
            where.gradeLevel = gradeLevel;
        }
        const resources = await this.resourcesRepository.find({
            where,
            relations: ['relatedSkills'],
        });
        return resources.map(resource => ({
            id: resource.id,
            title: resource.title,
            description: resource.description,
            url: resource.url,
            type: resource.type,
            estimatedTimeMinutes: resource.estimatedTimeMinutes,
            tags: resource.tags || [],
        }));
    }
    async createRecommendationResource(resourceData) {
        const skills = await this.skillsRepository.find({
            where: { id: (0, typeorm_2.In)(resourceData.skillIds) }
        });
        if (skills.length !== resourceData.skillIds.length) {
            throw new common_1.BadRequestException('One or more skill IDs are invalid');
        }
        const resource = this.resourcesRepository.create({
            title: resourceData.title,
            description: resourceData.description,
            url: resourceData.url,
            type: resourceData.type,
            estimatedTimeMinutes: resourceData.estimatedTimeMinutes,
            gradeLevel: resourceData.gradeLevel,
            tags: resourceData.tags,
            relatedSkills: skills,
            isAiGenerated: resourceData.isAiGenerated || false,
        });
        const savedResource = await this.resourcesRepository.save(resource);
        return {
            id: savedResource.id,
            title: savedResource.title,
            description: savedResource.description,
            url: savedResource.url,
            type: savedResource.type,
            estimatedTimeMinutes: savedResource.estimatedTimeMinutes,
            tags: savedResource.tags || [],
        };
    }
    async getUserRecommendationHistory(userId, limit, offset, skillId, completed) {
        const where = { user: { id: userId } };
        if (completed !== undefined) {
            where.isCompleted = completed;
        }
        if (skillId) {
            where.skill = { id: skillId };
        }
        const take = limit && limit > 0 ? limit : undefined;
        const skip = offset && offset >= 0 ? offset : undefined;
        this.logger.log(`Fetching history for user ${userId}: filters=(${JSON.stringify(where)}), limit=${take}, offset=${skip}`);
        const history = await this.historyRepository.find({
            where,
            relations: ['skill', 'resource'],
            order: { createdAt: 'DESC' },
            take: take,
            skip: skip,
        });
        return history.map(item => ({
            id: item.id,
            skillId: item.skill.id,
            skillName: item.skill.name,
            resourceId: item.resource.id,
            resourceTitle: item.resource.title,
            priority: item.priority,
            userScore: item.userScore,
            targetScore: item.targetScore,
            isCompleted: item.isCompleted,
            completedAt: item.completedAt,
            wasHelpful: item.wasHelpful,
            createdAt: item.createdAt,
        }));
    }
    async getSkillById(skillId) {
        return this.skillsRepository.findOneBy({ id: skillId });
    }
    async getAiSkillGapExplanation(userId, skillId) {
        this.logger.log(`Fetching AI explanation for skill gap: User ${userId}, Skill ${skillId}`);
        const skill = await this.getSkillById(skillId);
        if (!skill) {
            throw new common_1.NotFoundException(`Skill with ID ${skillId} not found.`);
        }
        const latestScoreRecord = await this._getLatestScoreForSkill(userId, skillId);
        if (!latestScoreRecord) {
            throw new common_1.NotFoundException(`No assessment score found for skill ${skillId} for user ${userId}. Cannot generate explanation.`);
        }
        const latestScore = latestScoreRecord.score;
        const assessmentHistory = await this._getUserAssessmentHistoryForSkill(userId, skillId);
        if (!assessmentHistory || assessmentHistory.length === 0) {
            this.logger.warn(`No assessment history found for skill ${skillId} for user ${userId}. Proceeding without history context.`);
        }
        try {
            const aiResult = await this.aiRecommendationService.generateRecommendation(userId, skill, latestScore, assessmentHistory);
            if (!aiResult || !aiResult.explanation) {
                this.logger.warn(`AI service did not return a valid explanation for skill ${skillId}, user ${userId}.`);
                throw new common_1.InternalServerErrorException('AI service failed to provide an explanation for the skill gap.');
            }
            return aiResult.explanation;
        }
        catch (error) {
            this.logger.error(`AI service failed to generate explanation for skill ${skillId}, user ${userId}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to generate AI explanation for the skill gap.');
        }
    }
    async _createAiRecommendation(user, gap, assessmentHistory) {
        this.logger.log(`Attempting AI recommendation for user ${user.id}, skill ${gap.skillId}`);
        try {
            const aiResult = await this.aiRecommendationService.generateRecommendation(user.id, gap.skill, gap.score, assessmentHistory);
            if (!aiResult) {
                this.logger.warn(`AI service did not return a valid recommendation for skill ${gap.skillId}.`);
                return null;
            }
            const aiResource = this.resourcesRepository.create({
                title: aiResult.resourceTitle,
                description: aiResult.resourceDescription,
                url: aiResult.resourceUrl,
                type: aiResult.resourceType,
                estimatedTimeMinutes: 15,
                gradeLevel: user.gradeLevel,
                tags: ['ai-generated', gap.skill.name],
                relatedSkills: [gap.skill],
                isAiGenerated: true,
            });
            const savedResource = await this.resourcesRepository.save(aiResource);
            this.logger.log(`Saved AI generated resource ${savedResource.id}`);
            const recommendationDto = {
                id: `ai-${savedResource.id}`,
                skillId: gap.skillId,
                skillName: gap.skill.name,
                priority: aiResult.priority,
                score: gap.score,
                targetScore: 650,
                explanation: aiResult.explanation,
                aiGenerated: true,
                resources: [{
                        id: savedResource.id,
                        title: savedResource.title,
                        description: savedResource.description,
                        url: savedResource.url,
                        type: savedResource.type,
                        estimatedTimeMinutes: savedResource.estimatedTimeMinutes,
                        tags: savedResource.tags || [],
                    }],
            };
            await this.saveRecommendationToHistory(user, gap.skill, savedResource, recommendationDto);
            return recommendationDto;
        }
        catch (error) {
            this.logger.error(`Failed during AI recommendation generation/saving for skill ${gap.skillId}: ${error.message}`, error.stack);
            return null;
        }
    }
    async _getGapsToAddress(userId, queryParams) {
        const latestScoreBySkill = await this._getLatestSkillScores(userId);
        const skillGaps = this._identifySkillGaps(latestScoreBySkill, queryParams.skillId);
        let gapsToAddress = skillGaps;
        if (queryParams.skillId && !skillGaps.some(g => g.skillId === queryParams.skillId)) {
            const specificSkillData = await this._getSpecificSkillData(queryParams.skillId, latestScoreBySkill);
            if (specificSkillData) {
                gapsToAddress = [specificSkillData];
            }
            else {
                this.logger.log(`Requested skill ${queryParams.skillId} not found or no score available.`);
                gapsToAddress = [];
            }
        }
        else if (queryParams.skillId) {
            gapsToAddress = skillGaps.filter(gap => gap.skillId === queryParams.skillId);
        }
        return gapsToAddress;
    }
    async _generateRecommendationsForGaps(user, gaps, queryParams) {
        const recommendationPromises = [];
        for (const gap of gaps) {
            recommendationPromises.push(this._generateSingleRecommendation(user, gap, queryParams));
        }
        const resolvedRecommendations = await Promise.all(recommendationPromises);
        const validRecommendations = resolvedRecommendations.filter((rec) => rec !== null);
        return validRecommendations;
    }
    _createRecommendationSummary(validRecommendations, latestScoreBySkill) {
        const overallScoreAverage = latestScoreBySkill.size > 0
            ? Array.from(latestScoreBySkill.values()).reduce((sum, score) => sum + score.score, 0) / latestScoreBySkill.size
            : 500;
        const overallProgress = Math.round(Math.min(100, Math.max(0, (overallScoreAverage - 400) / 4)));
        let summary = 'Here are some recommendations based on your recent performance.';
        if (validRecommendations.length === 0) {
            summary = 'No specific recommendations at this time. Keep up the good work!';
        }
        else if (validRecommendations.some(r => r.priority === recommendation_dto_1.RecommendationPriority.CRITICAL)) {
            summary = 'You have critical skill gaps that need attention. Focus on these recommendations.';
        }
        return { summary, overallProgress };
    }
    _createRecommendationDto(resource, gap) {
        const { priority, explanation } = this._determinePriorityAndExplanation(gap);
        return {
            id: `std-${gap.skillId}-${Date.now()}`,
            skillId: gap.skillId,
            skillName: gap.skill.name,
            priority,
            score: gap.score,
            targetScore: this.SKILL_THRESHOLD_LOW + 50,
            explanation,
            aiGenerated: false,
            resources: [{
                    id: resource.id,
                    title: resource.title,
                    description: resource.description,
                    url: resource.url,
                    type: resource.type,
                    estimatedTimeMinutes: resource.estimatedTimeMinutes,
                    tags: resource.tags || [],
                }],
        };
    }
    async _getUserSkillScoreBefore(userId, skillId, date) {
        const score = await this.scoresRepository.findOne({
            where: {
                user: { id: userId },
                skill: { id: skillId },
                lastAssessedAt: (0, typeorm_2.LessThan)(date),
            },
            order: { lastAssessedAt: 'DESC' },
        });
        return score?.score || 500;
    }
    async _getUserSkillScoreAfter(userId, skillId, date) {
        const score = await this.scoresRepository.findOne({
            where: {
                user: { id: userId },
                skill: { id: skillId },
                lastAssessedAt: (0, typeorm_2.MoreThan)(date),
            },
            order: { lastAssessedAt: 'ASC' },
        });
        return score?.score || 500;
    }
    async _cacheAiRecommendation(userId, skillId, recommendation) {
        try {
            if (!this.redisService.isEnabled()) {
                return;
            }
            const cacheKey = `ai_rec:${userId}:${skillId}`;
            await this.redisService.setWithExpiry(cacheKey, JSON.stringify(recommendation), this.AI_CACHE_TTL);
        }
        catch (error) {
            this.logger.warn(`Cache storage failed: ${error.message}`);
        }
    }
    async _generateAiRecommendationWithRetry(user, gap, history) {
        this.AI_METRICS.totalRequests++;
        const startTime = Date.now();
        const provider = this.aiRecommendationService.getCurrentProvider();
        try {
            for (let attempt = 1; attempt <= this.AI_RETRY_ATTEMPTS; attempt++) {
                try {
                    const aiRecommendation = await this.aiRecommendationService.generateRecommendation(user.id, gap.skill, gap.score, history);
                    if (aiRecommendation) {
                        this.AI_METRICS.successfulRequests++;
                        this._updateAiMetrics(startTime);
                        return aiRecommendation;
                    }
                    const error = {
                        code: 'NULL_RESPONSE',
                        message: `AI generation attempt ${attempt} returned null`,
                        timestamp: new Date(),
                        userId: user.id,
                        skillId: gap.skillId,
                        attempt,
                        provider,
                    };
                    this._recordLlmError(error);
                    this.logger.warn(`AI generation attempt ${attempt} returned null for skill ${gap.skillId}`, {
                        userId: user.id,
                        skillId: gap.skillId,
                        attempt,
                        totalAttempts: this.AI_RETRY_ATTEMPTS,
                        provider,
                    });
                }
                catch (error) {
                    const llmError = {
                        code: error.code || 'UNKNOWN_ERROR',
                        message: error.message,
                        timestamp: new Date(),
                        userId: user.id,
                        skillId: gap.skillId,
                        attempt,
                        provider,
                    };
                    this._recordLlmError(llmError);
                    this.logger.error(`AI generation attempt ${attempt} failed for skill ${gap.skillId}: ${error.message}`, {
                        userId: user.id,
                        skillId: gap.skillId,
                        attempt,
                        totalAttempts: this.AI_RETRY_ATTEMPTS,
                        error: error.stack,
                        provider,
                    });
                    if (this._isFatalAiError(error)) {
                        this.AI_METRICS.failedRequests++;
                        this._updateAiMetrics(startTime);
                        throw error;
                    }
                }
                if (attempt < this.AI_RETRY_ATTEMPTS) {
                    await new Promise(resolve => setTimeout(resolve, this.AI_RETRY_DELAY * attempt));
                }
            }
            this.AI_METRICS.failedRequests++;
            this._updateAiMetrics(startTime);
            return null;
        }
        catch (error) {
            this.AI_METRICS.failedRequests++;
            this._updateAiMetrics(startTime);
            throw error;
        }
    }
    _recordLlmError(error) {
        const currentCount = this.AI_METRICS.errorsByType.get(error.code) || 0;
        this.AI_METRICS.errorsByType.set(error.code, currentCount + 1);
        this.AI_METRICS.recentErrors.push(error);
        if (this.AI_METRICS.recentErrors.length > this.AI_METRICS.maxRecentErrors) {
            this.AI_METRICS.recentErrors.shift();
        }
    }
    _isFatalAiError(error) {
        const fatalErrors = [
            'INVALID_API_KEY',
            'QUOTA_EXCEEDED',
            'INVALID_REQUEST',
            'CONTENT_POLICY_VIOLATION',
        ];
        return (error.code && fatalErrors.includes(error.code) ||
            error.message && fatalErrors.some(msg => error.message.includes(msg)));
    }
    _updateAiMetrics(startTime) {
        const responseTime = Date.now() - startTime;
        this.AI_METRICS.totalResponseTime += responseTime;
        this.AI_METRICS.averageResponseTime =
            this.AI_METRICS.totalResponseTime /
                (this.AI_METRICS.successfulRequests + this.AI_METRICS.failedRequests);
    }
    async _checkAiRecommendationCache(userId, skillId) {
        try {
            if (!this.redisService.isEnabled()) {
                this.AI_METRICS.cacheMisses++;
                return null;
            }
            const cacheKey = `ai_rec:${userId}:${skillId}`;
            const cachedData = await this.redisService.get(cacheKey);
            if (!cachedData) {
                this.AI_METRICS.cacheMisses++;
                return null;
            }
            let recommendation;
            try {
                recommendation = JSON.parse(cachedData);
            }
            catch (error) {
                this.logger.warn(`Failed to parse cached data for user ${userId}, skill ${skillId}`);
                await this.redisService.del(cacheKey);
                this.AI_METRICS.cacheMisses++;
                return null;
            }
            if (!this._isValidRecommendationDto(recommendation)) {
                this.logger.warn(`Invalid cached recommendation data for user ${userId}, skill ${skillId}`);
                await this.redisService.del(cacheKey);
                this.AI_METRICS.cacheMisses++;
                return null;
            }
            this.AI_METRICS.cacheHits++;
            return recommendation;
        }
        catch (error) {
            this.logger.warn(`Cache check failed: ${error.message}`, error.stack);
            this.AI_METRICS.cacheMisses++;
            return null;
        }
    }
    _isValidRecommendationDto(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        const dto = data;
        return (typeof dto.id === 'string' &&
            typeof dto.skillId === 'string' &&
            typeof dto.skillName === 'string' &&
            typeof dto.score === 'number' &&
            typeof dto.targetScore === 'number' &&
            typeof dto.explanation === 'string' &&
            typeof dto.aiGenerated === 'boolean' &&
            Array.isArray(dto.resources) &&
            dto.resources.length > 0 &&
            dto.resources.every(resource => typeof resource.id === 'string' &&
                typeof resource.title === 'string' &&
                typeof resource.description === 'string' &&
                typeof resource.url === 'string' &&
                typeof resource.type === 'string' &&
                typeof resource.estimatedTimeMinutes === 'number' &&
                Array.isArray(resource.tags)));
    }
    async getAiMetrics() {
        const totalCacheAttempts = this.AI_METRICS.cacheHits + this.AI_METRICS.cacheMisses;
        const totalRequests = this.AI_METRICS.successfulRequests + this.AI_METRICS.failedRequests;
        const errorsByType = {};
        this.AI_METRICS.errorsByType.forEach((count, code) => {
            errorsByType[code] = count;
        });
        return {
            totalRequests: this.AI_METRICS.totalRequests,
            successRate: totalRequests > 0 ?
                (this.AI_METRICS.successfulRequests / totalRequests) * 100 : 0,
            cacheHitRate: totalCacheAttempts > 0 ?
                (this.AI_METRICS.cacheHits / totalCacheAttempts) * 100 : 0,
            averageResponseTime: this.AI_METRICS.averageResponseTime,
            errorMetrics: {
                totalErrors: this.AI_METRICS.failedRequests,
                errorsByType,
                recentErrors: [...this.AI_METRICS.recentErrors],
            },
        };
    }
    async addRecommendationFeedback(userId, recommendationId, feedbackDto) {
        const recommendation = await this.historyRepository.findOne({
            where: { id: recommendationId, user: { id: userId } },
        });
        if (!recommendation) {
            throw new common_1.NotFoundException('Recommendation not found');
        }
        const { isValid, sanitized, issues } = this.feedbackValidation.validateAndSanitize(feedbackDto);
        if (!isValid) {
            this.logger.warn(`Invalid feedback received: ${issues.join(', ')}`);
        }
        const feedback = this.feedbackRepository.create({
            userId,
            recommendationId,
            ...sanitized,
        });
        if (sanitized.feedbackType === recommendation_feedback_entity_1.FeedbackType.HELPFUL) {
            recommendation.wasHelpful = true;
        }
        else if (sanitized.feedbackType === recommendation_feedback_entity_1.FeedbackType.NOT_HELPFUL) {
            recommendation.wasHelpful = false;
        }
        await this.historyRepository.save(recommendation);
        return this.feedbackRepository.save(feedback);
    }
    async getRecommendationFeedback(userId, recommendationId) {
        const recommendation = await this.historyRepository.findOne({
            where: { id: recommendationId, user: { id: userId } },
        });
        if (!recommendation) {
            throw new common_1.NotFoundException('Recommendation not found');
        }
        return this.feedbackRepository.find({
            where: { recommendationId },
            order: { createdAt: 'DESC' },
        });
    }
    async getUserFeedbackStats(userId) {
        const feedback = await this.feedbackRepository.find({
            where: { userId },
        });
        const feedbackByType = feedback.reduce((acc, curr) => {
            acc[curr.feedbackType] = (acc[curr.feedbackType] || 0) + 1;
            return acc;
        }, {});
        const impactScores = feedback
            .filter(f => f.impactScore !== null)
            .map(f => f.impactScore);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);
        const trends = await this.feedbackAnalysis.analyzeTrends(startDate, new Date(), 'week');
        const categoryAnalysis = await this.feedbackAnalysis.analyzeBySkillCategory();
        const resourceTypeAnalysis = await this.feedbackAnalysis.analyzeResourceTypes(90);
        return {
            totalFeedback: feedback.length,
            feedbackByType,
            averageImpactScore: impactScores.length > 0
                ? impactScores.reduce((a, b) => a + b, 0) / impactScores.length
                : 0,
            trends,
            categoryAnalysis: categoryAnalysis.map(category => ({
                ...category,
                confidenceScore: 0.85,
            })),
            resourceTypeAnalysis,
        };
    }
};
exports.RecommendationsService = RecommendationsService;
exports.RecommendationsService = RecommendationsService = RecommendationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(skill_entity_1.Skill)),
    __param(2, (0, typeorm_1.InjectRepository)(assessment_skill_score_entity_1.AssessmentSkillScore)),
    __param(3, (0, typeorm_1.InjectRepository)(assessment_session_entity_1.AssessmentSession)),
    __param(4, (0, typeorm_1.InjectRepository)(assessment_response_entity_1.AssessmentResponse)),
    __param(5, (0, typeorm_1.InjectRepository)(recommendation_resource_entity_1.RecommendationResource)),
    __param(6, (0, typeorm_1.InjectRepository)(recommendation_history_entity_1.RecommendationHistory)),
    __param(7, (0, typeorm_1.InjectRepository)(recommendation_feedback_entity_1.RecommendationFeedback)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        ai_recommendation_service_1.AiRecommendationService,
        redis_service_1.RedisService,
        feedback_validation_service_1.FeedbackValidationService,
        feedback_analysis_service_1.FeedbackAnalysisService])
], RecommendationsService);
//# sourceMappingURL=recommendations.service.js.map