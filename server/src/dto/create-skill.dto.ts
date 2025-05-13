import { IsString, IsNotEmpty, IsOptional, MaxLength, IsNumber, Min, Max, IsDate, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { SkillStatus } from 'src/entities/skill.entity';

export class CreateSkillDto {
  @ApiProperty({ description: 'Name of the skill', maxLength: 100, example: 'Algebraic Equations' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Subject the skill belongs to', maxLength: 100, example: 'Mathematics' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  subject: string;

  @ApiPropertyOptional({ description: 'Category within the subject', maxLength: 100, example: 'Algebra' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ description: 'Detailed description of the skill', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Target grade level for the skill', minimum: 1, maximum: 12, example: 9 })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(12)
  gradeLevel: number;

  @ApiPropertyOptional({ description: 'Status of the skill', enum: SkillStatus, default: SkillStatus.ACTIVE, example: SkillStatus.ACTIVE })
  @IsEnum(SkillStatus)
  @IsOptional()
  status?: SkillStatus;
}

export class UpdateSkillDto extends PartialType(CreateSkillDto) {
  @ApiPropertyOptional({ description: 'Status of the skill', enum: SkillStatus, example: SkillStatus.ACTIVE })
  @IsEnum(SkillStatus)
  @IsOptional()
  status?: SkillStatus;

  @ApiPropertyOptional({ description: 'Date the skill was created', example: '2024-01-01' })
  @IsDate()
  @IsOptional()
  createdAt?: Date;

  @ApiPropertyOptional({ description: 'Date the skill was updated', example: '2024-01-01' })
  @IsDate()
  @IsOptional()
  updatedAt?: Date;

  @ApiPropertyOptional({ description: 'Date the skill was deleted', example: '2024-01-01' })
  @IsDate()
  @IsOptional()
  deletedAt?: Date;

  @ApiPropertyOptional({ description: 'User who created the skill', example: 'John Doe' })
  @IsString()
  @IsOptional()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'User who updated the skill', example: 'John Doe' })
  @IsString() 
  @IsOptional()
  updatedBy?: string;

  @ApiPropertyOptional({ description: 'User who deleted the skill', example: 'John Doe' })
  @IsString()
  @IsOptional()
  deletedBy?: string;

  @ApiPropertyOptional({ description: 'Prerequisites skills required', type: [String], example: ['Basic Arithmetic', 'Pre-Algebra'] })
  @IsOptional()
  prerequisites?: string[];
  
}
