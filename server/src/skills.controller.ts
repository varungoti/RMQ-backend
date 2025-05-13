import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Skill } from './entities/skill.entity';

@ApiTags('Skills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('skills')
export class SkillsController {
  private readonly logger = new Logger(SkillsController.name);

  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new skill (Admin Only)' })
  @ApiResponse({ status: 201, description: 'Skill created.', type: Skill })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed.' })
  create(@Body(ValidationPipe) createSkillDto: CreateSkillDto): Promise<Skill> {
    this.logger.log(`Received request to create skill: ${createSkillDto.name}`);
    return this.skillsService.create(createSkillDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all skills' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of skills.',
    type: Skill,
    isArray: true
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(): Promise<Skill[]> {
    this.logger.log('Received request to find all skills');
    return this.skillsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single skill by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Skill ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Skill details.', type: Skill })
  @ApiResponse({ status: 404, description: 'Skill not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Skill> {
    this.logger.log(`Received request to find skill with ID: ${id}`);
    return this.skillsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a skill (Admin Only)' })
  @ApiParam({ name: 'id', type: String, description: 'Skill ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Skill updated.', type: Skill })
  @ApiResponse({ status: 404, description: 'Skill not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateSkillDto: UpdateSkillDto,
  ): Promise<Skill> {
    this.logger.log(`Received request to update skill with ID: ${id}`);
    return this.skillsService.update(id, updateSkillDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a skill (Admin Only)' })
  @ApiParam({ name: 'id', type: String, description: 'Skill ID (UUID)' })
  @ApiResponse({ status: 204, description: 'Skill deleted.' })
  @ApiResponse({ status: 404, description: 'Skill not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    this.logger.log(`Received request to remove skill with ID: ${id}`);
    return this.skillsService.remove(id);
  }
}
