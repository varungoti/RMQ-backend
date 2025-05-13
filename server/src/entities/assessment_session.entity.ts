import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Int, Float, registerEnumType } from '@nestjs/graphql';
import { User } from './user.entity';
import { AssessmentResponse } from './assessment_response.entity';
import { AssessmentSkillScore } from './assessment_skill_score.entity';
import { Skill } from './skill.entity';
import { Expose, Type } from 'class-transformer';

export enum AssessmentStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

registerEnumType(AssessmentStatus, {
  name: 'AssessmentStatus',
});

@ObjectType()
@Entity({ name: 'assessment_sessions' })
export class AssessmentSession {
  @Expose()
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Expose()
  @Field(() => AssessmentStatus)
  @Column({
    type: 'enum',
    enum: AssessmentStatus,
    default: AssessmentStatus.IN_PROGRESS,
    nullable: false,
  })
  status: AssessmentStatus;

  @Expose()
  @Field()
  @CreateDateColumn({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Expose()
  @Field({ nullable: true })
  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Expose()
  @Field(() => Float, { nullable: true })
  @Column({ name: 'overall_score', type: 'numeric', precision: 5, scale: 2, nullable: true })
  overallScore?: number;

  @Expose()
  @Field(() => Int, { nullable: true })
  @Column({ name: 'overall_level', type: 'integer', nullable: true })
  overallLevel?: number;

  @Field(() => [String])
  @Column({ name: 'question_ids', type: 'text', array: true })
  questionIds: string[];

  // --- Relationships ---
  @Expose()
  @Field(() => User)
  @Type(() => User)
  @ManyToOne(() => User, (user: User) => user.assessmentSessions, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Expose()
  @Field(() => Skill)
  @Type(() => Skill)
  @ManyToOne(() => Skill, { nullable: false, eager: true })
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;

  @Expose()
  @Field(() => [AssessmentResponse], { nullable: 'itemsAndList' })
  @Type(() => AssessmentResponse)
  @OneToMany(() => AssessmentResponse, (response: AssessmentResponse) => response.assessmentSession)
  responses: AssessmentResponse[];
} 