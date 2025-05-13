import {
  Injectable,
  NotFoundException,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question, QuestionStatus } from './entities/question.entity';
import { Skill } from './entities/skill.entity';
import { CreateQuestionDto } from './dto/question.dto';
import { UpdateQuestionDto } from './dto/question.dto';

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
    @InjectRepository(Skill)
    private skillsRepository: Repository<Skill>,
  ) {}

  /**
   * Creates a new question and associates it with a skill.
   * @param createQuestionDto - DTO containing question details.
   * @returns The newly created question object.
   * @throws NotFoundException if the associated skill is not found.
   */
  async create(createQuestionDto: CreateQuestionDto): Promise<Question> {
    this.logger.log(`Attempting to create question for skill ID: ${createQuestionDto.primarySkillId}`);
    
    const skill = await this.skillsRepository.findOneBy({ id: createQuestionDto.primarySkillId });
    if (!skill) {
      this.logger.warn(`Skill not found for ID: ${createQuestionDto.primarySkillId}`);
      throw new NotFoundException(`Skill with ID ${createQuestionDto.primarySkillId} not found`);
    }

    try {
      const newQuestion = this.questionsRepository.create({
        ...createQuestionDto,
        primarySkill: skill, // Associate the found skill entity
        status: createQuestionDto.status ?? QuestionStatus.DRAFT, // Default to draft if not provided
      });

      const savedQuestion = await this.questionsRepository.save(newQuestion);
      this.logger.log(`Successfully created question with ID: ${savedQuestion.id}`);
      return savedQuestion;
    } catch (error) {
      this.logger.error(`Failed to create question: ${error.message}`, error.stack);
      // Consider more specific error handling if needed (e.g., constraint violations)
      throw new InternalServerErrorException('Failed to create question.');
    }
  }

  /**
   * Retrieves all questions.
   * TODO: Add pagination and filtering options.
   * @returns An array of all question objects.
   */
  async findAll(): Promise<Question[]> {
    this.logger.log('Fetching all questions');
    try {
        // TODO: Add pagination, filtering, sorting options later
        return await this.questionsRepository.find({ relations: ['primarySkill'] }); // Load skill relation
    } catch (error) {
        this.logger.error(`Failed to fetch all questions: ${error.message}`, error.stack);
        throw new InternalServerErrorException('Failed to retrieve questions.');
    }
  }

   /**
   * Retrieves a single question by its ID.
   * @param id - The ID (UUID string) of the question to retrieve.
   * @returns The question object.
   * @throws NotFoundException if the question is not found.
   */
  async findOne(id: string): Promise<Question> {
    this.logger.log(`Fetching question with ID: ${id}`);
    try {
        const question = await this.questionsRepository.findOne({ 
            where: { id },
            relations: ['primarySkill'] // Load skill relation
        });
        if (!question) {
            throw new NotFoundException(`Question with ID ${id} not found`);
        }
        return question;
    } catch (error) {
         if (error instanceof NotFoundException) {
            throw error; // Re-throw NotFoundException
         }
        this.logger.error(`Failed to fetch question ID ${id}: ${error.message}`, error.stack);
        throw new InternalServerErrorException(`Failed to retrieve question ID ${id}.`);
    }
  }

  /**
   * Updates an existing question.
   * @param id - The ID (UUID string) of the question to update.
   * @param updateQuestionDto - DTO containing the fields to update.
   * @returns The updated question object.
   * @throws NotFoundException if the question or associated skill is not found.
   */
  async update(id: string, updateQuestionDto: UpdateQuestionDto): Promise<Question> {
    this.logger.log(`Attempting to update question ID: ${id}`);
    // Retrieve the existing question first to ensure it exists
    const existingQuestion = await this.findOne(id); // findOne handles NotFoundException

    let skill: Skill | undefined = undefined;
    if (updateQuestionDto.primarySkillId) {
        skill = await this.skillsRepository.findOneBy({ id: updateQuestionDto.primarySkillId });
        if (!skill) {
            this.logger.warn(`Skill not found for ID during update: ${updateQuestionDto.primarySkillId}`);
            throw new NotFoundException(`Skill with ID ${updateQuestionDto.primarySkillId} not found`);
        }
    }

    try {
        // Merge updates - TypeORM handles partial updates
        // We need to manually handle the skill relation if ID is provided
        const dtoToMerge = { ...updateQuestionDto };
        delete dtoToMerge.primarySkillId; // Remove skill ID before merging

        this.questionsRepository.merge(existingQuestion, dtoToMerge);

        if (skill) {
            existingQuestion.primarySkill = skill; // Update the skill relation if provided
        }
        
        const updatedQuestion = await this.questionsRepository.save(existingQuestion);
        this.logger.log(`Successfully updated question ID: ${id}`);
        return updatedQuestion;
    } catch (error) {
        this.logger.error(`Failed to update question ID ${id}: ${error.message}`, error.stack);
        throw new InternalServerErrorException(`Failed to update question ID ${id}.`);
    }
  }

  /**
   * Removes a question by its ID.
   * @param id - The ID (UUID string) of the question to remove.
   * @returns void
   * @throws NotFoundException if the question is not found.
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Attempting to remove question ID: ${id}`);
    // Use delete and check affected rows for consistency
    const result = await this.questionsRepository.delete({ id }); 
    if (result.affected === 0) {
      this.logger.error(`Remove failed: Question with ID "${id}" not found.`);
      throw new NotFoundException(`Question with ID "${id}" not found`);
    }
    this.logger.log(`Successfully removed question ID: ${id}`);
    // Original try...catch block removed as delete itself is less likely to throw 
    // unexpected errors compared to save/update, and NotFound is handled by checking affected rows.
    // Potential FK constraint errors would still throw a DB error, leading to 500, which is acceptable.
  }
}
