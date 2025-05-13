import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  ValueTransformer,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql'; // Import GraphQL decorators
import { User } from './user.entity';
import { Skill } from './skill.entity';

// Define a transformer for numeric types
export class NumericTransformer implements ValueTransformer {
  /**
   * Used to marshal data when writing to the database.
   */
  to(data: number | null): string | null {
    return data?.toString() ?? null;
  }
  /**
   * Used to unmarshal data when reading from the database.
   */
  from(data: string | null): number | null {
    // Handle potential null or non-numeric strings
    if (data === null || data === undefined) return null;
    const numberValue = parseFloat(data);
    return isNaN(numberValue) ? null : numberValue;
  }
}

@ObjectType() // Mark as GraphQL Object Type
@Entity({ name: 'assessment_skill_scores' })
@Unique(['user', 'skill']) // Ensure one score per skill per USER
export class AssessmentSkillScore {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Float) // Use Float for numeric types in GraphQL
  @Column({ 
    name: 'score', 
    type: 'numeric', 
    precision: 5, 
    scale: 2, 
    default: 0, 
    nullable: false, 
    transformer: new NumericTransformer() // Add transformer
  })
  score: number; // Could be raw score, percentage, etc.

  @Field(() => Int, { nullable: true })
  @Column({ name: 'level', type: 'integer', nullable: true })
  level?: number; // Calculated level based on score

  @Field(() => Int)
  @Column({ name: 'questions_attempted', type: 'integer', default: 0, nullable: false })
  questionsAttempted: number;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'last_assessed_at', type: 'timestamp with time zone' })
  lastAssessedAt: Date;

  // --- Relationships ---
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.skillScores, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field(() => Skill)
  @ManyToOne(() => Skill, { nullable: false, eager: true }) // Skill name might be useful to load often
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;
} 