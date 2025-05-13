import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { RecommendationFeedback, FeedbackType } from '../entities/recommendation_feedback.entity';
import { RecommendationType } from '../dto/recommendation.dto';
import { Skill } from '../entities/skill.entity';
import * as natural from 'natural';

interface FeedbackTrend {
  period: string;
  totalFeedback: number;
  helpfulPercentage: number;
  averageImpactScore: number;
  mostCommonIssues: Array<{ issue: string; count: number }>;
  sentimentTrend: {
    averageScore: number;
    positivePercentage: number;
    negativePercentage: number;
  };
  categoryDistribution: Array<{ category: string; percentage: number }>;
}

interface FeedbackCluster {
  id: string;
  centroid: string;
  size: number;
  feedback: Array<{
    id: string;
    comment: string;
    sentiment: { score: number; comparative: number };
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
  commonIssues: Array<{ issue: string; count: number }>;
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
  skillCategories: Array<{ category: string; effectiveness: number }>;
  trends: FeedbackTrend[];
  sentimentAnalysis: {
    averageScore: number;
    positivePercentage: number;
    negativePercentage: number;
  };
}

/**
 * Represents a category for feedback with associated keywords and patterns
 */
interface FeedbackCategory {
  name: string;
  keywords: string[];
  patterns: RegExp[];
  description: string;
}

/**
 * Represents the categorization results for feedback
 */
interface FeedbackCategorization {
  primaryCategory: string;
  confidence: number;
  categories: Array<{
    name: string;
    confidence: number;
    matchedKeywords: string[];
  }>;
}

@Injectable()
export class FeedbackAnalysisService {
  private readonly logger = new Logger(FeedbackAnalysisService.name);
  private readonly tokenizer = new natural.WordTokenizer();
  private readonly tfidf = new natural.TfIdf();

  /**
   * Predefined categories for feedback classification
   */
  private readonly feedbackCategories: FeedbackCategory[] = [
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

  constructor(
    @InjectRepository(RecommendationFeedback)
    private readonly feedbackRepository: Repository<RecommendationFeedback>,
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
  ) {}

  /**
   * Categorizes feedback based on content analysis
   * 
   * @param feedback - The feedback to categorize
   * @returns Categorization results with confidence scores
   */
  async categorizeFeedback(feedback: RecommendationFeedback): Promise<FeedbackCategorization> {
    if (!feedback.comment) {
      return {
        primaryCategory: 'Uncategorized',
        confidence: 0,
        categories: []
      };
    }

    const categories = this.feedbackCategories.map(category => {
      const matchedKeywords = category.keywords.filter(keyword =>
        feedback.comment!.toLowerCase().includes(keyword.toLowerCase())
      );

      const matchedPatterns = category.patterns.filter(pattern =>
        pattern.test(feedback.comment!)
      );

      const keywordConfidence = matchedKeywords.length / category.keywords.length;
      const patternConfidence = matchedPatterns.length / category.patterns.length;
      const confidence = (keywordConfidence + patternConfidence) / 2;

      return {
        name: category.name,
        confidence,
        matchedKeywords
      };
    });

    // Sort categories by confidence
    categories.sort((a, b) => b.confidence - a.confidence);

    return {
      primaryCategory: categories[0]?.confidence > 0 ? categories[0].name : 'Uncategorized',
      confidence: categories[0]?.confidence || 0,
      categories
    };
  }

  /**
   * Analyzes feedback trends with categorization
   */
  async analyzeTrends(
    startDate: Date,
    endDate: Date,
    interval: 'day' | 'week' | 'month' = 'week',
  ): Promise<FeedbackTrend[]> {
    const feedback = await this.feedbackRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'ASC' },
    });

    const trends: FeedbackTrend[] = [];
    const periods = this.generatePeriods(startDate, endDate, interval);

    for (const period of periods) {
      const periodFeedback = feedback.filter(f => 
        f.createdAt >= period.start && f.createdAt < period.end
      );

      if (periodFeedback.length > 0) {
        // Categorize feedback for this period
        const categorizations = await Promise.all(
          periodFeedback.map(f => this.categorizeFeedback(f))
        );

        // Calculate category distribution
        const categoryDistribution = new Map<string, number>();
        categorizations.forEach(cat => {
          if (cat.primaryCategory !== 'Uncategorized') {
            categoryDistribution.set(
              cat.primaryCategory,
              (categoryDistribution.get(cat.primaryCategory) || 0) + 1
            );
          }
        });

        const helpfulCount = periodFeedback.filter(f => 
          f.feedbackType === FeedbackType.HELPFUL
        ).length;

        const impactScores = periodFeedback
          .filter(f => f.impactScore !== null)
          .map(f => f.impactScore!);

        const sentimentScores = periodFeedback
          .filter(f => f.metadata?.sentiment)
          .map(f => f.metadata.sentiment.score);

        const positiveCount = sentimentScores.filter(score => score > 0).length;
        const negativeCount = sentimentScores.filter(score => score < 0).length;

        const issues = new Map<string, number>();
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

  /**
   * Clusters feedback comments based on similarity
   */
  private async clusterFeedback(feedback: RecommendationFeedback[]): Promise<FeedbackCluster[]> {
    const clusters: FeedbackCluster[] = [];
    const processedFeedback = feedback.filter(f => f.comment && f.metadata?.sentiment);

    // Build TF-IDF corpus
    this.tfidf.reset();
    processedFeedback.forEach(f => {
      if (f.comment) {
        this.tfidf.addDocument(f.comment);
      }
    });

    // Simple clustering based on cosine similarity
    const similarityThreshold = 0.3;
    const processed = new Set<string>();

    for (const feedback of processedFeedback) {
      if (processed.has(feedback.id)) continue;

      const cluster: FeedbackCluster = {
        id: `cluster_${clusters.length + 1}`,
        centroid: feedback.comment!,
        size: 1,
        feedback: [{
          id: feedback.id,
          comment: feedback.comment!,
          sentiment: feedback.metadata.sentiment,
        }],
        commonThemes: [],
        averageSentiment: feedback.metadata.sentiment.score,
      };

      processed.add(feedback.id);

      // Find similar feedback
      for (const other of processedFeedback) {
        if (processed.has(other.id)) continue;

        const similarity = this.calculateCosineSimilarity(
          this.tfidf.tfidfs(feedback.comment!),
          this.tfidf.tfidfs(other.comment!)
        );

        if (similarity > similarityThreshold) {
          cluster.feedback.push({
            id: other.id,
            comment: other.comment!,
            sentiment: other.metadata.sentiment,
          });
          cluster.size++;
          cluster.averageSentiment = 
            (cluster.averageSentiment * (cluster.size - 1) + other.metadata.sentiment.score) / cluster.size;
          processed.add(other.id);
        }
      }

      // Extract common themes
      cluster.commonThemes = this.extractCommonThemes(cluster.feedback.map(f => f.comment));
      clusters.push(cluster);
    }

    return clusters;
  }

  /**
   * Calculates cosine similarity between two vectors
   */
  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Extracts common themes from a set of comments
   */
  private extractCommonThemes(comments: string[]): string[] {
    const wordFrequencies = new Map<string, number>();
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

  /**
   * Analyzes feedback by skill category
   */
  async analyzeBySkillCategory(): Promise<SkillCategoryAnalysis[]> {
    const skills = await this.skillRepository.find();
    const feedback = await this.feedbackRepository.find({
      relations: ['recommendation', 'recommendation.skill'],
    });

    const categoryMap = new Map<string, SkillCategoryAnalysis>();

    // Group skills by category
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

    // Analyze feedback for each category
    feedback.forEach(f => {
      const category = f.recommendation.skill.category;
      const categoryAnalysis = categoryMap.get(category);
      if (categoryAnalysis) {
        categoryAnalysis.totalFeedback++;

        if (f.feedbackType === FeedbackType.HELPFUL) {
          categoryAnalysis.helpfulPercentage = 
            ((categoryAnalysis.helpfulPercentage * (categoryAnalysis.totalFeedback - 1)) + 100) / categoryAnalysis.totalFeedback;
        }

        if (f.impactScore !== null) {
          categoryAnalysis.averageImpactScore = 
            ((categoryAnalysis.averageImpactScore * (categoryAnalysis.totalFeedback - 1)) + f.impactScore) / categoryAnalysis.totalFeedback;
        }

        // Track resource type preferences
        const resourceType = f.metadata?.resourceType as RecommendationType;
        if (resourceType && f.feedbackType === FeedbackType.HELPFUL) {
          if (!categoryAnalysis.preferredResourceTypes.includes(resourceType)) {
            categoryAnalysis.preferredResourceTypes.push(resourceType);
          }
        }

        // Track common issues
        if (f.comment) {
          const issueIndex = categoryAnalysis.commonIssues.findIndex(i => i.issue === f.comment);
          if (issueIndex >= 0) {
            categoryAnalysis.commonIssues[issueIndex].count++;
          } else {
            categoryAnalysis.commonIssues.push({ issue: f.comment, count: 1 });
          }
          categoryAnalysis.commonIssues.sort((a, b) => b.count - a.count);
          if (categoryAnalysis.commonIssues.length > 5) {
            categoryAnalysis.commonIssues.pop();
          }
        }

        // Update sentiment analysis
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

    // Cluster feedback comments
    for (const categoryAnalysis of categoryMap.values()) {
      categoryAnalysis.clusters = await this.clusterFeedback(
        await this.feedbackRepository.find({
          where: {
            recommendation: {
              skill: {
                category: categoryAnalysis.category,
              },
            },
          },
          relations: ['metadata'],
        })
      );
    }

    return Array.from(categoryMap.values());
  }

  /**
   * Analyzes effectiveness of different resource types
   */
  async analyzeResourceTypes(timeframe: number = 90): Promise<ResourceTypeAnalysis[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);

    const feedback = await this.feedbackRepository.find({
      where: {
        createdAt: Between(startDate, new Date()),
      },
      relations: ['recommendation', 'recommendation.skill'],
    });

    const analysisMap = new Map<RecommendationType, ResourceTypeAnalysis>();

    feedback.forEach(f => {
      const resourceType = f.metadata?.resourceType as RecommendationType;
      if (!resourceType) return;

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

      const analysis = analysisMap.get(resourceType)!;
      analysis.totalUsage++;

      if (f.feedbackType === FeedbackType.HELPFUL) {
        analysis.helpfulPercentage = 
          ((analysis.helpfulPercentage * (analysis.totalUsage - 1)) + 100) / analysis.totalUsage;
      }

      if (f.impactScore !== null) {
        analysis.averageImpactScore = 
          ((analysis.averageImpactScore * (analysis.totalUsage - 1)) + f.impactScore) / analysis.totalUsage;
      }

      // Track effectiveness by skill category
      const category = f.recommendation.skill.category;
      const categoryIndex = analysis.skillCategories.findIndex(c => c.category === category);
      if (categoryIndex >= 0) {
        const effectiveness = f.feedbackType === FeedbackType.HELPFUL ? 100 : 0;
        analysis.skillCategories[categoryIndex].effectiveness = 
          (analysis.skillCategories[categoryIndex].effectiveness + effectiveness) / 2;
      } else {
        analysis.skillCategories.push({
          category,
          effectiveness: f.feedbackType === FeedbackType.HELPFUL ? 100 : 0,
        });
      }

      // Update sentiment analysis
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

    // Add trend analysis for each resource type
    for (const analysis of analysisMap.values()) {
      analysis.trends = await this.analyzeTrends(startDate, new Date(), 'week');
    }

    return Array.from(analysisMap.values());
  }

  /**
   * Generates time periods for trend analysis
   */
  private generatePeriods(startDate: Date, endDate: Date, interval: 'day' | 'week' | 'month'): Array<{
    start: Date;
    end: Date;
    label: string;
  }> {
    const periods: Array<{ start: Date; end: Date; label: string }> = [];
    let currentDate = new Date(startDate);

    while (currentDate < endDate) {
      const periodStart = new Date(currentDate);
      let periodEnd: Date;
      let label: string;

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
} 