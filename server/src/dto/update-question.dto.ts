import { PartialType } from '@nestjs/mapped-types';
import { CreateQuestionDto } from './create-question.dto';

/**
 * UpdateQuestionDto inherits all properties from CreateQuestionDto,
 * but makes them all optional using PartialType.
 * Validation decorators from CreateQuestionDto are also inherited.
 */
export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {} 