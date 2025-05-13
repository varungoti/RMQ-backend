import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql'; // Import GraphQL decorators
import { AssessmentSession } from './assessment_session.entity'; // Import related entity
import { AssessmentSkillScore } from './assessment_skill_score.entity'; // Import AssessmentSkillScore

// Define Enum for GraphQL
export enum UserRole {
  STUDENT = 'student',
  PARENT = 'parent',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

// Register the enum with GraphQL
registerEnumType(UserRole, {
  name: 'UserRole', // this one is mandatory
  description: 'The role of the user within the platform', // this one is optional
});

@ObjectType() // Mark class as a GraphQL Object Type
@Entity({ name: 'users' }) // Map to the 'users' table
export class User {
  @Field(() => ID) // Expose field to GraphQL as ID type
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field() // Expose field to GraphQL (string type is inferred)
  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  // Password hash should NOT be exposed in GraphQL
  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: false })
  passwordHash: string;

  @Field({ nullable: true }) // Expose optional field
  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
  firstName?: string;

  @Field({ nullable: true }) // Expose optional field
  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
  lastName?: string;

  @Field(() => Int) // Expose field as Int type
  @Column({ name: 'grade_level', type: 'integer', nullable: false })
  gradeLevel: number;

  @Field(() => UserRole) // Expose enum field
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
    nullable: false,
  })
  role: UserRole;

  @Field() // Expose timestamp (GraphQL ISODate is inferred)
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // --- Relationships ---
  @OneToMany(() => AssessmentSession, (session: AssessmentSession) => session.user)
  assessmentSessions: AssessmentSession[];

  // Add relation to AssessmentSkillScore
  @OneToMany(() => AssessmentSkillScore, (score) => score.user)
  skillScores: AssessmentSkillScore[];
} 