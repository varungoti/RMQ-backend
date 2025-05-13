import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { Expose, Type } from 'class-transformer';
import { AssessmentSession } from './assessment_session.entity';
import { Question } from './question.entity';

@ObjectType()
@Entity({ name: 'assessment_responses' })
export class AssessmentResponse {
  @Expose()
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Expose()
  @Field()
  @Column({ name: 'user_response', type: 'text', nullable: false })
  userResponse: string;

  @Expose()
  @Field(() => Boolean)
  @Column({ name: 'is_correct', type: 'boolean', nullable: false })
  isCorrect: boolean;

  @Expose()
  @Field()
  @CreateDateColumn({ name: 'answered_at', type: 'timestamptz' })
  answeredAt: Date;

  @Expose()
  @Field(() => Int, { nullable: true })
  @Column({ name: 'response_time_ms', type: 'integer', nullable: true })
  responseTimeMs?: number;

  // --- Relationships ---
  @Expose()
  @Field(() => AssessmentSession)
  @Type(() => AssessmentSession)
  @ManyToOne(() => AssessmentSession, (session) => session.responses, { nullable: false })
  @JoinColumn({ name: 'assessment_session_id' })
  assessmentSession: AssessmentSession;

  @Expose()
  @Field(() => Question)
  @Type(() => Question)
  @ManyToOne(() => Question, { nullable: false, eager: false })
  @JoinColumn({ name: 'question_id' })
  question: Question;
} 