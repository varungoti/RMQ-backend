import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Skill } from './skill.entity';
import { RecommendationResource } from './recommendation_resource.entity';
import { RecommendationType, RecommendationPriority } from 'src/dto/recommendation.dto';
import { RecommendationFeedback } from './recommendation_feedback.entity';

@Entity()
export class Recommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Skill)
  skill: Skill;

  @Column()
  skillId: string;

  @Column()
  skillName: string;

  @Column({
    type: 'enum',
    enum: RecommendationPriority,
    default: RecommendationPriority.MEDIUM,
  })
  priority: RecommendationPriority;

  @Column('float')
  score: number;

  @Column('float')
  targetScore: number;

  @Column('text')
  explanation: string;

  @Column({ default: false })
  aiGenerated: boolean;

  @ManyToMany(() => RecommendationResource)
  @JoinTable()
  resources: RecommendationResource[];

  @OneToMany(() => RecommendationFeedback, feedback => feedback.recommendation)
  feedback: RecommendationFeedback[];

  @Column({ default: false })
  completed: boolean;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  wasHelpful: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 