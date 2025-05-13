import { IsString, IsEnum, IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RecommendationType, RecommendationPriority } from './recommendation.dto';

/**
 * DTO representing the structured response expected from the AI 
 * for generating a full recommendation.
 */
export class AiGeneratedRecommendationDto {
  @ApiProperty({ description: 'Explanation why this resource is recommended', example: 'This video clearly explains the steps for factoring quadratics, addressing your recent errors.' })
  @IsString()
  @IsNotEmpty()
  explanation: string;

  @ApiProperty({ description: 'Catchy title for the learning resource', example: 'Master Quadratic Factoring in 10 Minutes!' })
  @IsString()
  @IsNotEmpty()
  resourceTitle: string;

  @ApiProperty({ description: 'Brief description of the learning resource', example: 'A quick video tutorial covering the AC method and difference of squares.' })
  @IsString()
  @IsNotEmpty()
  resourceDescription: string;

  @ApiProperty({ description: 'The type of resource suggested', enum: RecommendationType, example: RecommendationType.VIDEO })
  @IsEnum(RecommendationType)
  resourceType: RecommendationType;

  @ApiProperty({ description: 'A valid URL to the learning resource', example: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:quadratics-multiplying-factoring/x2f8bb11595b61c86:factor-quadratics-strategy/v/factoring-quadratic-expressions' })
  @IsUrl()
  resourceUrl: string;

  @ApiProperty({ description: 'The priority level assigned by the AI', enum: RecommendationPriority, example: RecommendationPriority.HIGH })
  @IsEnum(RecommendationPriority)
  priority: RecommendationPriority;
} 