import { Test, TestingModule } from '@nestjs/testing';
import { SkillsService } from './skills.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Skill } from './entities/skill.entity';
import { Repository } from 'typeorm';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { NotFoundException } from '@nestjs/common';

// Mock TypeORM repository
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('SkillsService', () => {
  let service: SkillsService;
  let repository: MockRepository<Skill>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        { 
          provide: getRepositoryToken(Skill), 
          useValue: createMockRepository<Skill>(),
        },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
    repository = module.get<MockRepository<Skill>>(getRepositoryToken(Skill));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new skill', async () => {
      const createSkillDto: CreateSkillDto = {
        name: 'Test Skill',
        description: 'Test Description',
        gradeLevel: 5,
        subject: 'Math',
      };
      const expectedSkill = {
        id: 'some-uuid',
        ...createSkillDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: [],
        resources: [],
      };

      repository.create.mockReturnValue(expectedSkill);
      repository.save.mockResolvedValue(expectedSkill);

      const result = await service.create(createSkillDto);

      expect(repository.create).toHaveBeenCalledWith(createSkillDto);
      expect(repository.save).toHaveBeenCalledWith(expectedSkill);
      expect(result).toEqual(expectedSkill);
    });
  });

  describe('findAll', () => {
    it('should return an array of skills', async () => {
      const skill1 = { id: 'uuid1', name: 'Skill 1', description: 'Desc 1', gradeLevel: 5, subject: 'Math', createdAt: new Date(), updatedAt: new Date(), questions: [], resources: [] };
      const skill2 = { id: 'uuid2', name: 'Skill 2', description: 'Desc 2', gradeLevel: 6, subject: 'Science', createdAt: new Date(), updatedAt: new Date(), questions: [], resources: [] };
      const expectedSkills = [skill1, skill2];

      repository.find.mockResolvedValue(expectedSkills);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual(expectedSkills);
    });

    it('should return an empty array if no skills exist', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    const skillId = 'some-uuid';
    const expectedSkill = {
      id: skillId,
      name: 'Found Skill',
      description: 'Found Desc',
      gradeLevel: 5,
      subject: 'Math',
      createdAt: new Date(),
      updatedAt: new Date(),
      questions: [],
      resources: [],
    };

    it('should return a skill if found', async () => {
      repository.findOneBy.mockResolvedValue(expectedSkill);

      const result = await service.findOne(skillId);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: skillId });
      expect(result).toEqual(expectedSkill);
    });

    it('should throw NotFoundException if skill is not found', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(skillId)).rejects.toThrow(NotFoundException);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: skillId });
    });
  });

  describe('update', () => {
    const skillId = 'some-uuid';
    const updateSkillDto: UpdateSkillDto = {
      name: 'Updated Skill Name',
      description: 'Updated Description',
    };
    const existingSkill = {
      id: skillId,
      name: 'Original Skill',
      description: 'Original Desc',
      gradeLevel: 5,
      subject: 'Math',
      createdAt: new Date(),
      updatedAt: new Date(),
      questions: [],
      resources: [],
    };
    const updatedSkill = { 
      ...existingSkill, 
      ...updateSkillDto,
      updatedAt: new Date(), // Should be updated by TypeORM
    };

    it('should update a skill if found', async () => {
      // Mock findOneBy to return the existing skill
      repository.findOneBy.mockResolvedValue(existingSkill);
      // Mock save to return the updated skill
      repository.save.mockResolvedValue(updatedSkill); 

      const result = await service.update(skillId, updateSkillDto);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: skillId });
      // Check that save was called with the merged object
      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
        ...existingSkill, 
        ...updateSkillDto
      }));
      expect(result).toEqual(updatedSkill);
    });

    it('should throw NotFoundException if skill to update is not found', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.update(skillId, updateSkillDto)).rejects.toThrow(NotFoundException);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: skillId });
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const skillId = 'some-uuid';

    it('should remove a skill if found', async () => {
      // Mock the delete method to simulate successful deletion
      repository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(skillId);

      expect(repository.delete).toHaveBeenCalledWith(skillId);
    });

    it('should throw NotFoundException if skill to remove is not found', async () => {
      // Mock the delete method to simulate deletion of a non-existent skill
      repository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(skillId)).rejects.toThrow(NotFoundException);
      expect(repository.delete).toHaveBeenCalledWith(skillId);
    });
  });
});
