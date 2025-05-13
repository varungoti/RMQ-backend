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
var FeedbackAnalysisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackAnalysisService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const recommendation_feedback_entity_1 = require("../entities/recommendation_feedback.entity");
const skill_entity_1 = require("../entities/skill.entity");
const natural_compat_1 = require("./natural-compat");
const natural = { WordTokenizer: natural_compat_1.WordTokenizer, TfIdf: natural_compat_1.TfIdf, PorterStemmer: natural_compat_1.PorterStemmer, SentimentAnalyzer: natural_compat_1.SentimentAnalyzer };
let FeedbackAnalysisService = FeedbackAnalysisService_1 = class FeedbackAnalysisService {
    constructor(feedbackRepository, skillRepository) {
        this.feedbackRepository = feedbackRepository;
        this.skillRepository = skillRepository;
        this.logger = new common_1.Logger(FeedbackAnalysisService_1.name);
        this.tokenizer = new natural.WordTokenizer();
        this.tfidf = new natural.TfIdf();
        this.feedbackCategories = [
            {
                name: 'Content Quality',
                keywords: ['quality', 'clear', 'confusing', 'well-explained', 'difficult', 'easy'],
                patterns: [
                    /quality of (?:the )?content/i,
                    /(?:not )?clear(?:ly)? (?:explained|presented)/i,
                    /(?:too )?(?:difficult|easy) to (?:understand|follow)/i
                ],
                description: 'Feedback about the quality and clarity of content'
            },
            {
                name: 'Technical Issues',
                keywords: ['bug', 'error', 'broken', 'not working', 'crash', 'glitch'],
                patterns: [
                    /(?:technical )?(?:issue|problem|bug|error)/i,
                    /(?:not )?working (?:properly|correctly)/i,
                    /(?:system|application) (?:crash|error|failure)/i
                ],
                description: 'Feedback about technical problems or bugs'
            },
            {
                name: 'User Experience',
                keywords: ['interface', 'ui', 'ux', 'design', 'layout', 'navigation'],
                patterns: [
                    /(?:user )?(?:interface|experience|design)/i,
                    /(?:difficult|easy) to (?:use|navigate)/i,
                    /(?:layout|design) (?:issue|problem)/i
                ],
                description: 'Feedback about user interface and experience'
            },
            {
                name: 'Performance',
                keywords: ['slow', 'fast', 'performance', 'speed', 'lag', 'responsive'],
                patterns: [
                    /(?:too )?(?:slow|fast)/i,
                    /performance (?:issue|problem)/i,
                    /(?:lag|delay|response time)/i
                ],
                description: 'Feedback about system performance and speed'
            }
        ];
    }
    async categorizeFeedback(feedback) {
        if (!feedback.comment) {
            return {
                primaryCategory: 'Uncategorized',
                confidence: 0,
                categories: []
            };
        }
        const categories = this.feedbackCategories.map(category => {
            const matchedKeywords = category.keywords.filter(keyword => feedback.comment.toLowerCase().includes(keyword.toLowerCase()));
            const matchedPatterns = category.patterns.filter(pattern => pattern.test(feedback.comment));
            const keywordConfidence = matchedKeywords.length / category.keywords.length;
            const patternConfidence = matchedPatterns.length / category.patterns.length;
            const confidence = (keywordConfidence + patternConfidence) / 2;
            return {
                name: category.name,
                confidence,
                matchedKeywords
            };
        });
        categories.sort((a, b) => b.confidence - a.confidence);
        return {
            primaryCategory: categories[0]?.confidence > 0 ? categories[0].name : 'Uncategorized',
            confidence: categories[0]?.confidence || 0,
            categories
        };
    }
    async analyzeTrends(startDate, endDate, interval = 'week') {
        const feedback = await this.feedbackRepository.find({
            where: {
                createdAt: (0, typeorm_2.Between)(startDate, endDate),
            },
            order: { createdAt: 'ASC' },
        });
        const trends = [];
        const periods = this.generatePeriods(startDate, endDate, interval);
        for (const period of periods) {
            const periodFeedback = feedback.filter(f => f.createdAt >= period.start && f.createdAt < period.end);
            if (periodFeedback.length > 0) {
                const categorizations = await Promise.all(periodFeedback.map(f => this.categorizeFeedback(f)));
                const categoryDistribution = new Map();
                categorizations.forEach(cat => {
                    if (cat.primaryCategory !== 'Uncategorized') {
                        categoryDistribution.set(cat.primaryCategory, (categoryDistribution.get(cat.primaryCategory) || 0) + 1);
                    }
                });
                const helpfulCount = periodFeedback.filter(f => f.feedbackType === recommendation_feedback_entity_1.FeedbackType.HELPFUL).length;
                const impactScores = periodFeedback
                    .filter(f => f.impactScore !== null)
                    .map(f => f.impactScore);
                const sentimentScores = periodFeedback
                    .filter(f => f.metadata?.sentiment)
                    .map(f => f.metadata.sentiment.score);
                const positiveCount = sentimentScores.filter(score => score > 0).length;
                const negativeCount = sentimentScores.filter(score => score < 0).length;
                const issues = new Map();
                periodFeedback.forEach(f => {
                    if (f.comment) {
                        issues.set(f.comment, (issues.get(f.comment) || 0) + 1);
                    }
                });
                trends.push({
                    period: period.label,
                    totalFeedback: periodFeedback.length,
                    helpfulPercentage: (helpfulCount / periodFeedback.length) * 100,
                    averageImpactScore: impactScores.length > 0
                        ? impactScores.reduce((a, b) => a + b, 0) / impactScores.length
                        : 0,
                    mostCommonIssues: Array.from(issues.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([issue, count]) => ({ issue, count })),
                    sentimentTrend: {
                        averageScore: sentimentScores.length > 0
                            ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
                            : 0,
                        positivePercentage: sentimentScores.length > 0
                            ? (positiveCount / sentimentScores.length) * 100
                            : 0,
                        negativePercentage: sentimentScores.length > 0
                            ? (negativeCount / sentimentScores.length) * 100
                            : 0,
                    },
                    categoryDistribution: Array.from(categoryDistribution.entries())
                        .map(([category, count]) => ({
                        category,
                        percentage: (count / periodFeedback.length) * 100
                    }))
                });
            }
        }
        return trends;
    }
    async clusterFeedback(feedback) {
        const clusters = [];
        const processedFeedback = feedback.filter(f => f.comment && f.metadata?.sentiment);
        this.tfidf.reset();
        processedFeedback.forEach(f => {
            if (f.comment) {
                this.tfidf.addDocument(f.comment);
            }
        });
        const similarityThreshold = 0.3;
        const processed = new Set();
        for (const feedback of processedFeedback) {
            if (processed.has(feedback.id))
                continue;
            const cluster = {
                id: `cluster_${clusters.length + 1}`,
                centroid: feedback.comment,
                size: 1,
                feedback: [{
                        id: feedback.id,
                        comment: feedback.comment,
                        sentiment: feedback.metadata.sentiment,
                    }],
                commonThemes: [],
                averageSentiment: feedback.metadata.sentiment.score,
            };
            processed.add(feedback.id);
            for (const other of processedFeedback) {
                if (processed.has(other.id))
                    continue;
                const similarity = this.calculateCosineSimilarity(this.tfidf.tfidfs(feedback.comment), this.tfidf.tfidfs(other.comment));
                if (similarity > similarityThreshold) {
                    cluster.feedback.push({
                        id: other.id,
                        comment: other.comment,
                        sentiment: other.metadata.sentiment,
                    });
                    cluster.size++;
                    cluster.averageSentiment =
                        (cluster.averageSentiment * (cluster.size - 1) + other.metadata.sentiment.score) / cluster.size;
                    processed.add(other.id);
                }
            }
            cluster.commonThemes = this.extractCommonThemes(cluster.feedback.map(f => f.comment));
            clusters.push(cluster);
        }
        return clusters;
    }
    calculateCosineSimilarity(vec1, vec2) {
        const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
        const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
        const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
        return dotProduct / (magnitude1 * magnitude2);
    }
    extractCommonThemes(comments) {
        const wordFrequencies = new Map();
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by']);
        comments.forEach(comment => {
            const words = this.tokenizer.tokenize(comment.toLowerCase());
            words.forEach(word => {
                if (!stopWords.has(word) && word.length > 2) {
                    wordFrequencies.set(word, (wordFrequencies.get(word) || 0) + 1);
                }
            });
        });
        return Array.from(wordFrequencies.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);
    }
    async analyzeBySkillCategory() {
        const skills = await this.skillRepository.find();
        const feedback = await this.feedbackRepository.find({
            relations: ['recommendation', 'recommendation.skill'],
        });
        const categoryMap = new Map();
        skills.forEach(skill => {
            if (!categoryMap.has(skill.category)) {
                categoryMap.set(skill.category, {
                    category: skill.category,
                    categoryName: skill.name,
                    totalFeedback: 0,
                    helpfulPercentage: 0,
                    averageImpactScore: 0,
                    preferredResourceTypes: [],
                    commonIssues: [],
                    qualityScore: 0,
                    sentimentAnalysis: {
                        averageScore: 0,
                        positivePercentage: 0,
                        negativePercentage: 0,
                    },
                    clusters: [],
                });
            }
        });
        feedback.forEach(f => {
            const category = f.recommendation.skill.category;
            const categoryAnalysis = categoryMap.get(category);
            if (categoryAnalysis) {
                categoryAnalysis.totalFeedback++;
                if (f.feedbackType === recommendation_feedback_entity_1.FeedbackType.HELPFUL) {
                    categoryAnalysis.helpfulPercentage =
                        ((categoryAnalysis.helpfulPercentage * (categoryAnalysis.totalFeedback - 1)) + 100) / categoryAnalysis.totalFeedback;
                }
                if (f.impactScore !== null) {
                    categoryAnalysis.averageImpactScore =
                        ((categoryAnalysis.averageImpactScore * (categoryAnalysis.totalFeedback - 1)) + f.impactScore) / categoryAnalysis.totalFeedback;
                }
                const resourceType = f.metadata?.resourceType;
                if (resourceType && f.feedbackType === recommendation_feedback_entity_1.FeedbackType.HELPFUL) {
                    if (!categoryAnalysis.preferredResourceTypes.includes(resourceType)) {
                        categoryAnalysis.preferredResourceTypes.push(resourceType);
                    }
                }
                if (f.comment) {
                    const issueIndex = categoryAnalysis.commonIssues.findIndex(i => i.issue === f.comment);
                    if (issueIndex >= 0) {
                        categoryAnalysis.commonIssues[issueIndex].count++;
                    }
                    else {
                        categoryAnalysis.commonIssues.push({ issue: f.comment, count: 1 });
                    }
                    categoryAnalysis.commonIssues.sort((a, b) => b.count - a.count);
                    if (categoryAnalysis.commonIssues.length > 5) {
                        categoryAnalysis.commonIssues.pop();
                    }
                }
                const sentiment = f.metadata?.sentiment;
                if (sentiment) {
                    categoryAnalysis.sentimentAnalysis.averageScore =
                        ((categoryAnalysis.sentimentAnalysis.averageScore * (categoryAnalysis.totalFeedback - 1)) + sentiment.score) / categoryAnalysis.totalFeedback;
                    categoryAnalysis.sentimentAnalysis.positivePercentage =
                        ((categoryAnalysis.sentimentAnalysis.positivePercentage * (categoryAnalysis.totalFeedback - 1)) + (sentiment.score > 0 ? 1 : 0)) / categoryAnalysis.totalFeedback;
                    categoryAnalysis.sentimentAnalysis.negativePercentage =
                        ((categoryAnalysis.sentimentAnalysis.negativePercentage * (categoryAnalysis.totalFeedback - 1)) + (sentiment.score < 0 ? 1 : 0)) / categoryAnalysis.totalFeedback;
                }
            }
        });
        for (const categoryAnalysis of categoryMap.values()) {
            categoryAnalysis.clusters = await this.clusterFeedback(await this.feedbackRepository.find({
                where: {
                    recommendation: {
                        skill: {
                            category: categoryAnalysis.category,
                        },
                    },
                },
                relations: ['metadata'],
            }));
        }
        return Array.from(categoryMap.values());
    }
    async analyzeResourceTypes(timeframe = 90) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeframe);
        const feedback = await this.feedbackRepository.find({
            where: {
                createdAt: (0, typeorm_2.Between)(startDate, new Date()),
            },
            relations: ['recommendation', 'recommendation.skill'],
        });
        const analysisMap = new Map();
        feedback.forEach(f => {
            const resourceType = f.metadata?.resourceType;
            if (!resourceType)
                return;
            if (!analysisMap.has(resourceType)) {
                analysisMap.set(resourceType, {
                    type: resourceType,
                    totalUsage: 0,
                    helpfulPercentage: 0,
                    averageImpactScore: 0,
                    skillCategories: [],
                    trends: [],
                    sentimentAnalysis: {
                        averageScore: 0,
                        positivePercentage: 0,
                        negativePercentage: 0,
                    },
                });
            }
            const analysis = analysisMap.get(resourceType);
            analysis.totalUsage++;
            if (f.feedbackType === recommendation_feedback_entity_1.FeedbackType.HELPFUL) {
                analysis.helpfulPercentage =
                    ((analysis.helpfulPercentage * (analysis.totalUsage - 1)) + 100) / analysis.totalUsage;
            }
            if (f.impactScore !== null) {
                analysis.averageImpactScore =
                    ((analysis.averageImpactScore * (analysis.totalUsage - 1)) + f.impactScore) / analysis.totalUsage;
            }
            const category = f.recommendation.skill.category;
            const categoryIndex = analysis.skillCategories.findIndex(c => c.category === category);
            if (categoryIndex >= 0) {
                const effectiveness = f.feedbackType === recommendation_feedback_entity_1.FeedbackType.HELPFUL ? 100 : 0;
                analysis.skillCategories[categoryIndex].effectiveness =
                    (analysis.skillCategories[categoryIndex].effectiveness + effectiveness) / 2;
            }
            else {
                analysis.skillCategories.push({
                    category,
                    effectiveness: f.feedbackType === recommendation_feedback_entity_1.FeedbackType.HELPFUL ? 100 : 0,
                });
            }
            const sentiment = f.metadata?.sentiment;
            if (sentiment) {
                analysis.sentimentAnalysis.averageScore =
                    ((analysis.sentimentAnalysis.averageScore * (analysis.totalUsage - 1)) + sentiment.score) / analysis.totalUsage;
                analysis.sentimentAnalysis.positivePercentage =
                    ((analysis.sentimentAnalysis.positivePercentage * (analysis.totalUsage - 1)) + (sentiment.score > 0 ? 1 : 0)) / analysis.totalUsage;
                analysis.sentimentAnalysis.negativePercentage =
                    ((analysis.sentimentAnalysis.negativePercentage * (analysis.totalUsage - 1)) + (sentiment.score < 0 ? 1 : 0)) / analysis.totalUsage;
            }
        });
        for (const analysis of analysisMap.values()) {
            analysis.trends = await this.analyzeTrends(startDate, new Date(), 'week');
        }
        return Array.from(analysisMap.values());
    }
    generatePeriods(startDate, endDate, interval) {
        const periods = [];
        let currentDate = new Date(startDate);
        while (currentDate < endDate) {
            const periodStart = new Date(currentDate);
            let periodEnd;
            let label;
            switch (interval) {
                case 'day':
                    periodEnd = new Date(currentDate.setDate(currentDate.getDate() + 1));
                    label = periodStart.toISOString().split('T')[0];
                    break;
                case 'week':
                    periodEnd = new Date(currentDate.setDate(currentDate.getDate() + 7));
                    label = `Week of ${periodStart.toISOString().split('T')[0]}`;
                    break;
                case 'month':
                    periodEnd = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
                    label = `${periodStart.toLocaleString('default', { month: 'long' })} ${periodStart.getFullYear()}`;
                    break;
            }
            periods.push({ start: periodStart, end: periodEnd, label });
            currentDate = new Date(periodEnd);
        }
        return periods;
    }
};
exports.FeedbackAnalysisService = FeedbackAnalysisService;
exports.FeedbackAnalysisService = FeedbackAnalysisService = FeedbackAnalysisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(recommendation_feedback_entity_1.RecommendationFeedback)),
    __param(1, (0, typeorm_1.InjectRepository)(skill_entity_1.Skill)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], FeedbackAnalysisService);
//# sourceMappingURL=feedback-analysis.service.js.map