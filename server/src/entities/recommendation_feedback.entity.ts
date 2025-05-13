import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Recommendation } from './recommendation.entity';

export enum FeedbackType {
  HELPFUL = 'helpful',
  NOT_HELPFUL = 'not_helpful',
  PARTIALLY_HELPFUL = 'partially_helpful',
  IRRELEVANT = 'irrelevant',
  TOO_DIFFICULT = 'too_difficult',
  TOO_EASY = 'too_easy',
}

export enum FeedbackSource {
  USER = 'user',
  ASSESSMENT = 'assessment',
  AI = 'ai',
  SYSTEM = 'system',
}

@Entity()
export class RecommendationFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Recommendation)
  recommendation: Recommendation;

  @Column()
  recommendationId: string;

  @Column({
    type: 'enum',
    enum: FeedbackType,
  })
  feedbackType: FeedbackType;

  @Column({
    type: 'enum',
    enum: FeedbackSource,
    default: FeedbackSource.USER,
  })
  source: FeedbackSource;

  @Column('text', { nullable: true })
  comment: string;

  @Column('float', { nullable: true })
  impactScore: number;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 