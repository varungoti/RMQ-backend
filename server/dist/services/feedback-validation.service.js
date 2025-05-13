"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var FeedbackValidationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackValidationService = void 0;
const common_1 = require("@nestjs/common");
const recommendation_feedback_entity_1 = require("../entities/recommendation_feedback.entity");
const natural_compat_1 = require("./natural-compat");
const natural = { WordTokenizer: natural_compat_1.WordTokenizer, TfIdf: natural_compat_1.TfIdf, PorterStemmer: natural_compat_1.PorterStemmer, SentimentAnalyzer: natural_compat_1.SentimentAnalyzer };
let FeedbackValidationService = FeedbackValidationService_1 = class FeedbackValidationService {
    constructor() {
        this.logger = new common_1.Logger(FeedbackValidationService_1.name);
        this.COMMENT_MAX_LENGTH = 1000;
        this.COMMENT_BLACKLIST = [
            'script',
            'javascript',
            'eval(',
            'onload',
            'onerror',
            '<',
            '>',
        ];
        this.tokenizer = new natural.WordTokenizer();
        this.sentimentAnalyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
        this.urgencyKeywords = new Set([
            'urgent', 'critical', 'important', 'asap', 'immediately',
            'broken', 'error', 'issue', 'problem', 'bug'
        ]);
    }
    validateAndSanitize(feedback) {
        const issues = [];
        const sanitized = { ...feedback };
        let sentiment;
        if (feedback.comment) {
            if (feedback.comment.length > this.COMMENT_MAX_LENGTH) {
                issues.push(`Comment exceeds maximum length of ${this.COMMENT_MAX_LENGTH} characters`);
                sanitized.comment = feedback.comment.substring(0, this.COMMENT_MAX_LENGTH);
            }
            if (this.COMMENT_BLACKLIST.some(term => feedback.comment.toLowerCase().includes(term))) {
                issues.push('Comment contains potentially unsafe content');
                sanitized.comment = this.sanitizeComment(feedback.comment);
            }
            sentiment = this.analyzeSentiment(sanitized.comment);
        }
        if (feedback.impactScore !== undefined) {
            if (feedback.impactScore < 0 || feedback.impactScore > 100) {
                issues.push('Impact score must be between 0 and 100');
                sanitized.impactScore = Math.max(0, Math.min(100, feedback.impactScore));
            }
        }
        if (feedback.metadata) {
            try {
                const sanitizedMetadata = this.sanitizeMetadata(feedback.metadata);
                sanitized.metadata = sanitizedMetadata;
            }
            catch (error) {
                issues.push('Invalid metadata format');
                sanitized.metadata = {};
            }
        }
        if (feedback.feedbackType === recommendation_feedback_entity_1.FeedbackType.HELPFUL && feedback.impactScore !== undefined && feedback.impactScore < 50) {
            issues.push('Inconsistent feedback: HELPFUL feedback with low impact score');
        }
        if (feedback.feedbackType === recommendation_feedback_entity_1.FeedbackType.NOT_HELPFUL && feedback.impactScore !== undefined && feedback.impactScore > 50) {
            issues.push('Inconsistent feedback: NOT_HELPFUL feedback with high impact score');
        }
        const qualityScore = this.calculateQualityScore(sanitized, sentiment);
        const priority = this.calculatePriorityScore(sanitized, sentiment);
        sanitized.metadata = {
            ...sanitized.metadata,
            priority,
            qualityScore,
            sentiment,
        };
        return {
            isValid: issues.length === 0,
            sanitized,
            issues,
            sentiment,
            priority,
        };
    }
    analyzeSentiment(comment) {
        const tokens = this.tokenizer.tokenize(comment);
        const score = this.sentimentAnalyzer.getSentiment(tokens);
        const comparative = score / tokens.length;
        return { score, comparative };
    }
    calculateQualityScore(feedback, sentiment) {
        let score = 0;
        if (feedback.comment && feedback.comment.length > 20) {
            score += 0.2;
        }
        if (feedback.impactScore !== undefined) {
            score += 0.2;
        }
        if (feedback.metadata && Object.keys(feedback.metadata).length > 0) {
            score += 0.2;
        }
        if (feedback.impactScore !== undefined) {
            const isConsistent = (feedback.feedbackType === recommendation_feedback_entity_1.FeedbackType.HELPFUL && feedback.impactScore > 50) ||
                (feedback.feedbackType === recommendation_feedback_entity_1.FeedbackType.NOT_HELPFUL && feedback.impactScore < 50);
            if (isConsistent) {
                score += 0.2;
            }
        }
        if (sentiment) {
            const sentimentConsistent = (feedback.feedbackType === recommendation_feedback_entity_1.FeedbackType.HELPFUL && sentiment.comparative > 0) ||
                (feedback.feedbackType === recommendation_feedback_entity_1.FeedbackType.NOT_HELPFUL && sentiment.comparative < 0);
            if (sentimentConsistent) {
                score += 0.2;
            }
        }
        return Math.min(1, score);
    }
    calculatePriorityScore(feedback, sentiment) {
        const factors = {
            sentiment: 0,
            impact: 0,
            urgency: 0,
            userEngagement: 0
        };
        if (sentiment) {
            factors.sentiment = Math.abs(sentiment.comparative);
        }
        if (feedback.impactScore !== undefined) {
            factors.impact = feedback.impactScore / 100;
        }
        if (feedback.comment) {
            const words = this.tokenizer.tokenize(feedback.comment.toLowerCase());
            const urgencyCount = words.filter(word => this.urgencyKeywords.has(word)).length;
            factors.urgency = Math.min(1, urgencyCount / 3);
        }
        if (feedback.metadata?.userEngagement) {
            factors.userEngagement = Math.min(1, feedback.metadata.userEngagement / 100);
        }
        const score = (factors.sentiment * 0.3 +
            factors.impact * 0.3 +
            factors.urgency * 0.2 +
            factors.userEngagement * 0.2);
        return { score, factors };
    }
    sanitizeComment(comment) {
        let sanitized = comment;
        sanitized = sanitized.replace(/<[^>]*>/g, '');
        this.COMMENT_BLACKLIST.forEach(term => {
            sanitized = sanitized.replace(new RegExp(term, 'gi'), '[REMOVED]');
        });
        sanitized = sanitized.replace(/\s+/g, ' ').trim();
        return sanitized;
    }
    sanitizeMetadata(metadata) {
        const sanitized = {};
        for (const [key, value] of Object.entries(metadata)) {
            if (typeof value === 'string' ||
                typeof value === 'number' ||
                typeof value === 'boolean' ||
                value === null) {
                sanitized[key] = value;
            }
            else if (Array.isArray(value)) {
                sanitized[key] = value.filter(item => typeof item === 'string' ||
                    typeof item === 'number' ||
                    typeof item === 'boolean');
            }
            else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeMetadata(value);
            }
        }
        return sanitized;
    }
};
exports.FeedbackValidationService = FeedbackValidationService;
exports.FeedbackValidationService = FeedbackValidationService = FeedbackValidationService_1 = __decorate([
    (0, common_1.Injectable)()
], FeedbackValidationService);
//# sourceMappingURL=feedback-validation.service.js.map