import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { Question } from './question.entity';
import { AssessmentSkillScore } from './assessment_skill_score.entity';

export enum SkillStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

registerEnumType(SkillStatus, {
  name: 'SkillStatus',
  description: 'The status of a skill (active or inactive)',
});

@ObjectType()
@Entity({ name: 'skills' })
export class Skill {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Field()
  @Column({ type: 'varchar', length: 100, nullable: false })
  subject: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Field(() => Int)
  @Column({ name: 'grade_level', type: 'integer', nullable: false })
  gradeLevel: number;

  @Field()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Field(() => SkillStatus)
  @Column({ name: 'status', type: 'enum', enum: SkillStatus, default: SkillStatus.ACTIVE, nullable: false })
  status: SkillStatus;

  @Field({ nullable: true })
  @Column({ name: 'image_url', type: 'varchar', length: 255, nullable: true })
  imageUrl?: string;

  @Field(() => Boolean)
  @Column({ name: 'is_primary', type: 'boolean', default: false, nullable: false })
  isPrimary: boolean;

  @Field(() => Boolean)
  @Column({ name: 'is_secondary', type: 'boolean', default: false, nullable: false })
  isSecondary: boolean;

  // --- Relationships ---
  @Field(() => [Question], { nullable: 'itemsAndList' })
  @OneToMany(type => Question, (question: Question) => question.primarySkill)
  questions: Question[];

  @Field(() => [AssessmentSkillScore], { nullable: 'itemsAndList' })
  @OneToMany(type => AssessmentSkillScore, (skillScore: AssessmentSkillScore) => skillScore.skill)
  skillScores: AssessmentSkillScore[];

  @Field(() => [Skill], { nullable: 'itemsAndList' })
  @ManyToMany(() => Skill, (skill: Skill) => skill.primarySkills)
  @JoinTable({
    name: 'skill_relationships',
    joinColumn: { name: 'primary_skill_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'secondary_skill_id', referencedColumnName: 'id' },
  })
  secondarySkills: Skill[];

  @Field(() => [Skill], { nullable: 'itemsAndList' })
  @ManyToMany(() => Skill, (skill: Skill) => skill.secondarySkills)
  @JoinTable({
    name: 'skill_relationships',
    joinColumn: { name: 'secondary_skill_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'primary_skill_id', referencedColumnName: 'id' },
  })
  primarySkills: Skill[];
} 