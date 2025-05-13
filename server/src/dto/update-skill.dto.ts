import { PartialType } from '@nestjs/swagger';
import { CreateSkillDto } from './create-skill.dto';

/**
 * UpdateSkillDto inherits all properties from CreateSkillDto,
 * but makes them all optional thanks to PartialType.
 * It also inherits the validation decorators and @ApiProperty decorators.
 */
export class UpdateSkillDto extends PartialType(CreateSkillDto) {} 