import { Repository } from 'typeorm';
import { RecommendationFeedback } from 'src/entities/recommendation_feedback.entity';
import { RecommendationType } from 'src/dto/recommendation.dto';
import { Skill } from 'src/entities/skill.entity';
interface FeedbackTrend {
    period: string;
    totalFeedback: number;
    helpfulPercentage: number;
    averageImpactScore: number;
    mostCommonIssues: Array<{
        issue: string;
        count: number;
    }>;
    sentimentTrend: {
        averageScore: number;
        positivePercentage: number;
        negativePercentage: number;
    };
    categoryDistribution: Array<{
        category: string;
        percentage: number;
    }>;
}
interface FeedbackCluster {
    id: string;
    centroid: string;
    size: number;
    feedback: Array<{
        id: string;
        comment: string;
        sentiment: {
            score: number;
            comparative: number;
        };
    }>;
    commonThemes: string[];
    averageSentiment: number;
}
interface SkillCategoryAnalysis {
    category: string;
    categoryName: string;
    totalFeedback: number;
    helpfulPercentage: number;
    averageImpactScore: number;
    preferredResourceTypes: RecommendationType[];
    commonIssues: Array<{
        issue: string;
        count: number;
    }>;
    qualityScore: number;
    sentimentAnalysis: {
        averageScore: number;
        positivePercentage: number;
        negativePercentage: number;
    };
    clusters: FeedbackCluster[];
}
interface ResourceTypeAnalysis {
    type: RecommendationType;
    totalUsage: number;
    helpfulPercentage: number;
    averageImpactScore: number;
    skillCategories: Array<{
        category: string;
        effectiveness: number;
    }>;
    trends: FeedbackTrend[];
    sentimentAnalysis: {
        averageScore: number;
        positivePercentage: number;
        negativePercentage: number;
    };
}
interface FeedbackCategorization {
    primaryCategory: string;
    confidence: number;
    categories: Array<{
        name: string;
        confidence: number;
        matchedKeywords: string[];
    }>;
}
export declare class FeedbackAnalysisService {
    private readonly feedbackRepository;
    private readonly skillRepository;
    private readonly logger;
    private readonly tokenizer;
    private readonly tfidf;
    private readonly feedbackCategories;
    constructor(feedbackRepository: Repository<RecommendationFeedback>, skillRepository: Repository<Skill>);
    categorizeFeedback(feedback: RecommendationFeedback): Promise<FeedbackCategorization>;
    analyzeTrends(startDate: Date, endDate: Date, interval?: 'day' | 'week' | 'month'): Promise<FeedbackTrend[]>;
    private clusterFeedback;
    private calculateCosineSimilarity;
    private extractCommonThemes;
    analyzeBySkillCategory(): Promise<SkillCategoryAnalysis[]>;
    analyzeResourceTypes(timeframe?: number): Promise<ResourceTypeAnalysis[]>;
    private generatePeriods;
}
export {};
