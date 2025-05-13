import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Skill } from './skill.entity';
import { RecommendationResource } from './recommendation_resource.entity';
import { RecommendationPriority } from 'src/dto/recommendation.dto';

@Entity()
export class RecommendationHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Skill, { nullable: false })
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;

  @ManyToOne(() => RecommendationResource, { nullable: false })
  @JoinColumn({ name: 'resource_id' })
  resource: RecommendationResource;

  @Column({
    type: 'enum',
    enum: RecommendationPriority,
    default: RecommendationPriority.MEDIUM,
  })
  priority: RecommendationPriority;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  userScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  targetScore: number;

  @Column({ type: 'text' })
  explanation: string;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'boolean', default: false })
  wasHelpful: boolean | null;

  @Column({ type: 'boolean', default: false })
  isAiGenerated: boolean;

  @CreateDateColumn()
  createdAt: Date;
} 