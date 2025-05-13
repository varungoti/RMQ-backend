import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql'; // Import GraphQL decorators
import { GraphQLJSONObject } from 'graphql-type-json'; // For JSON type
import { Skill } from './skill.entity';
import { AssessmentResponse } from './assessment_response.entity';
import { Expose, Type } from 'class-transformer'; // Import Expose and Type

export enum QuestionType {
  MCQ = 'MCQ',
  TRUE_FALSE = 'TrueFalse',
  SHORT_ANSWER = 'ShortAnswer',
  LONG_ANSWER = 'LongAnswer',
  MATCH_THE_FOLLOWING = 'MatchTheFollowing',
  FILL_IN_THE_BLANK = 'FillInTheBlank',
  MULTIPLE_SELECT = 'MultipleSelect',
  NUMERICAL = 'Numerical',
  GRAPHICAL = 'Graphical',
  PROBLEM_SOLVING = 'ProblemSolving',
  ESSAY = 'Essay',
  

  // Add other types as needed
}

export enum QuestionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  RETIRED = 'retired',
}

// Register enums with GraphQL
registerEnumType(QuestionType, {
  name: 'QuestionType',
});
registerEnumType(QuestionStatus, {
  name: 'QuestionStatus',
});

@ObjectType() // Mark class as a GraphQL Object Type
@Entity({ name: 'questions' }) // Map to the 'questions' table
export class Question {
  @Expose() // Add Expose
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Expose() // Add Expose
  @Field()
  @Column({ name: 'question_text', type: 'text', nullable: false })
  questionText: string;

  @Expose() // Add Expose
  @Field(() => QuestionType)
  @Column({
    name: 'question_type',
    type: 'enum',
    enum: QuestionType,
    nullable: false,
  })
  questionType: QuestionType;

  @Expose() // Add Expose
  @Field(() => GraphQLJSONObject, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  options?: Record<string, unknown>;

  // DO NOT Expose correct answer
  // @Expose()
  @Field()
  @Column({ name: 'correct_answer', type: 'varchar', length: 255, nullable: false })
  correctAnswer: string;

  @Expose() // Add Expose
  @Field(() => Int, { nullable: true })
  @Column({ name: 'difficulty_level', type: 'integer', nullable: true })
  difficultyLevel?: number;

  @Expose() // Add Expose
  @Field(() => Int)
  @Column({ name: 'grade_level', type: 'integer', nullable: false })
  gradeLevel: number;

  @Expose() // Add Expose
  @Field(() => QuestionStatus)
  @Column({
    type: 'enum',
    enum: QuestionStatus,
    default: QuestionStatus.DRAFT,
    nullable: false,
  })
  status: QuestionStatus;

  @Expose() // Add Expose
  @Field({ nullable: true })
  @Column({ name: 'image_url', type: 'varchar', length: 255, nullable: true })
  imageUrl?: string;

  @Expose() // Add Expose
  @Field()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Expose() // Add Expose
  @Field()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // --- Relationships ---
  @Expose() // Add Expose
  @Type(() => Skill) // Add Type
  @Field(() => Skill) // Expose Skill relationship
  @ManyToOne(() => Skill, (skill: Skill) => skill.questions, { nullable: false })
  @JoinColumn({ name: 'primary_skill_id' })
  primarySkill: Skill;

  // responses are usually fetched via the session, not needed here
  // @Expose()
  // @Type(() => AssessmentResponse)
  @OneToMany(type => AssessmentResponse, (response: AssessmentResponse) => response.question)
  responses: AssessmentResponse[];
} 