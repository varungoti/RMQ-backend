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
  HttpCode,
  HttpStatus,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/question.dto';
import { UpdateQuestionDto } from './dto/question.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole as Role } from './entities/user.entity';
import { Question } from './entities/question.entity';

@ApiTags('Questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('questions')
export class QuestionsController {
  private readonly logger = new Logger(QuestionsController.name);

  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new question (Admin only)' })
  @ApiResponse({ status: 201, description: 'The question has been successfully created.', type: Question })
  @ApiResponse({ status: 400, description: 'Bad Request (validation error)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (user is not Admin)' })
  @ApiResponse({ status: 404, description: 'Not Found (associated Skill not found)' })
  create(@Body(ValidationPipe) createQuestionDto: CreateQuestionDto): Promise<Question> {
    this.logger.log(`Received request to create question`);
    return this.questionsService.create(createQuestionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all questions' })
  @ApiResponse({ status: 200, description: 'List of all questions', type: [Question] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(): Promise<Question[]> {
    this.logger.log(`Received request to get all questions`);
    return this.questionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific question by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Question UUID' })
  @ApiResponse({ status: 200, description: 'The found question', type: Question })
  @ApiResponse({ status: 404, description: 'Question not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Question> {
    this.logger.log(`Received request to get question ID: ${id}`);
    return this.questionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a question (Admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Question UUID' })
  @ApiResponse({ status: 200, description: 'The updated question', type: Question })
  @ApiResponse({ status: 400, description: 'Bad Request (validation error)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (user is not Admin)' })
  @ApiResponse({ status: 404, description: 'Question or associated Skill not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateQuestionDto: UpdateQuestionDto,
  ): Promise<Question> {
    this.logger.log(`Received request to update question ID: ${id}`);
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a question (Admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Question UUID' })
  @ApiResponse({ status: 204, description: 'Question successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (user is not Admin)' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    this.logger.log(`Received request to delete question ID: ${id}`);
    return this.questionsService.remove(id);
  }
}
