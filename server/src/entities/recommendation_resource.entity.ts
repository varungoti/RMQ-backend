import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Skill } from './skill.entity';
import { RecommendationType } from 'src/dto/recommendation.dto';

@Entity()
export class RecommendationResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 2048 })
  url: string;

  @Column({
    type: 'enum',
    enum: RecommendationType,
    default: RecommendationType.PRACTICE,
  })
  type: RecommendationType;

  @Column({ type: 'int', default: 15 })
  estimatedTimeMinutes: number;

  @Column({ type: 'int' })
  gradeLevel: number;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @ManyToMany(() => Skill)
  @JoinTable({
    name: 'recommendation_resource_skills',
    joinColumn: { name: 'resource_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'skill_id', referencedColumnName: 'id' },
  })
  relatedSkills: Skill[];

  @Column({ type: 'boolean', default: false })
  isAiGenerated: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 