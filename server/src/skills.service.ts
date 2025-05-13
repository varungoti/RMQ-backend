import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from './entities/skill.entity';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name);

  constructor(
    @InjectRepository(Skill)
    private skillsRepository: Repository<Skill>,
  ) {}

  /**
   * Creates a new skill.
   * @param createSkillDto - DTO containing skill details.
   * @returns The newly created skill object.
   */
  async create(createSkillDto: CreateSkillDto): Promise<Skill> {
    this.logger.log(`Creating skill: ${createSkillDto.name}`);
    try {
      const newSkill = this.skillsRepository.create(createSkillDto);
      const savedSkill = await this.skillsRepository.save(newSkill);
      this.logger.log(`Skill created successfully with ID: ${savedSkill.id}`);
      return savedSkill;
    } catch (error) {
      this.logger.error(`Failed to create skill: ${error.message}`, error.stack);
      // Add more specific error handling if needed (e.g., unique constraint violation)
      throw error;
    }
  }

  /**
   * Retrieves all skills.
   * @returns An array of all skill objects.
   */
  async findAll(): Promise<Skill[]> {
    this.logger.log('Retrieving all skills');
    try {
      const skills = await this.skillsRepository.find();
      this.logger.log(`Retrieved ${skills.length} skills.`);
      return skills;
    } catch (error) {
      this.logger.error(`Failed to retrieve skills: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Retrieves a single skill by its ID.
   * @param id - The ID (UUID string) of the skill to retrieve.
   * @returns The skill object.
   * @throws NotFoundException if the skill is not found.
   */
  async findOne(id: string): Promise<Skill> {
    this.logger.log(`Retrieving skill with ID: ${id}`);
    try {
      // Use findOneByOrFail to automatically throw NotFoundException if not found
      const skill = await this.skillsRepository.findOneByOrFail({ id });
      this.logger.log(`Skill with ID ${id} retrieved successfully.`);
      return skill;
    } catch (error) {
      this.logger.error(`Failed to retrieve skill with ID ${id}: ${error.message}`, error.stack);
      // findOneByOrFail throws EntityNotFoundError, we can let it propagate
      // or catch it specifically if needed for custom logging/handling
      if (error.name === 'EntityNotFoundError') {
          throw new NotFoundException(`Skill with ID "${id}" not found`);
      }
      throw error; // Re-throw other errors
    }
  }

  /**
   * Updates an existing skill.
   * @param id - The ID (UUID string) of the skill to update.
   * @param updateSkillDto - DTO containing the fields to update.
   * @returns The updated skill object.
   * @throws NotFoundException if the skill is not found.
   */
  async update(id: string, updateSkillDto: UpdateSkillDto): Promise<Skill> {
    this.logger.log(`Attempting to update skill with ID: ${id}`);
    // Preload fetches the entity and copies DTO properties onto it
    // This ensures we only update existing fields and respects decorators
    const skill = await this.skillsRepository.preload({
        id: id, 
        ...updateSkillDto,
    });
    if (!skill) {
      this.logger.error(`Update failed: Skill with ID "${id}" not found.`);
      throw new NotFoundException(`Skill with ID "${id}" not found`);
    }
    try {
      const updatedSkill = await this.skillsRepository.save(skill);
      this.logger.log(`Skill with ID ${id} updated successfully.`);
      return updatedSkill;
    } catch (error) {
      this.logger.error(`Failed to update skill with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Removes a skill by its ID.
   * @param id - The ID (UUID string) of the skill to remove.
   * @returns void
   * @throws NotFoundException if the skill is not found.
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Attempting to remove skill with ID: ${id}`);
    const result = await this.skillsRepository.delete(id);
    if (result.affected === 0) {
      this.logger.error(`Remove failed: Skill with ID "${id}" not found.`);
      throw new NotFoundException(`Skill with ID "${id}" not found`);
    }
    this.logger.log(`Skill with ID ${id} removed successfully.`);
  }
}
