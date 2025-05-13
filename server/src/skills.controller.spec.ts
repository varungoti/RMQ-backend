import { Test, TestingModule } from '@nestjs/testing';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { Skill, SkillStatus } from './entities/skill.entity';

// Mock SkillsService
const mockSkillsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('SkillsController', () => {
  let controller: SkillsController;
  let service: typeof mockSkillsService;

  // Define Mock Skill structure matching the entity
  const mockSkill1: Skill = {
    id: 'skill-uuid-1',
    name: 'Skill 1',
    subject: 'Subject 1',
    description: 'Desc 1',
    category: 'Cat 1',
    gradeLevel: 5,
    questions: [],
    skillScores: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: SkillStatus.ACTIVE,
    isPrimary: true,
    isSecondary: false,
    //isTertiary: false,
    primarySkills: [],
    secondarySkills: [],
    //tertiarySkills: [],
  };
  const mockSkill2: Skill = {
    id: 'skill-uuid-2',
    name: 'Skill 2',
    subject: 'Subject 2',
    description: 'Desc 2',
    category: 'Cat 2',
    gradeLevel: 6,
    questions: [],
    skillScores: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: SkillStatus.ACTIVE,
    isPrimary: true,
    isSecondary: false,
    //isTertiary: false,
    primarySkills: [],
    secondarySkills: [],
    //tertiarySkills: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkillsController],
      providers: [
        {
          provide: SkillsService,
          useValue: mockSkillsService,
        },
      ],
    })
    // Mock JwtAuthGuard
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate: (context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId: 'test-user-id', email: 'test@example.com' };
        return true;
      },
    })
    .compile();

    controller = module.get<SkillsController>(SkillsController);
    service = module.get(SkillsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new skill', async () => {
      const createDto: CreateSkillDto = { name: 'New Skill', subject: 'New Subject', description: 'New Desc', category: 'New Cat', gradeLevel: 7 };
      const expectedResult: Skill = {
        id: 'new-skill-uuid',
        ...createDto,
        questions: [],
        skillScores: [],
        createdAt: new Date(),  
        updatedAt: new Date(),
        status: SkillStatus.ACTIVE,
        isPrimary: true,
        isSecondary: false,
        primarySkills: [],
        secondarySkills: [],
        //tertiarySkills: [],
      };

      jest.spyOn(service, 'create').mockResolvedValue(expectedResult);
      const result = await controller.create(createDto);
      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of skills', async () => {
      const expectedResult: Skill[] = [mockSkill1, mockSkill2];
      jest.spyOn(service, 'findAll').mockResolvedValue(expectedResult);
      const result = await controller.findAll();
      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a single skill by id', async () => {
      const skillId = 'uuid-1';
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSkill1);
      const result = await controller.findOne(skillId);
      expect(result).toEqual(mockSkill1);
      expect(service.findOne).toHaveBeenCalledWith(skillId);
    });

    it('should throw NotFoundException if service throws it', async () => {
      const skillId = 'not-found-uuid';
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());
      await expect(controller.findOne(skillId)).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith(skillId);
    });
  });

  describe('update', () => {
    it('should update a skill', async () => {
      const skillId = 'uuid-1';
      const updateDto: UpdateSkillDto = { description: 'Updated Desc' };
      const expectedResult: Skill = {
        ...mockSkill1,
        description: 'Updated Desc',
      };

      jest.spyOn(service, 'update').mockResolvedValue(expectedResult);
      const result = await controller.update(skillId, updateDto);
      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(skillId, updateDto);
    });

     it('should throw NotFoundException if service throws it', async () => {
      const skillId = 'not-found-uuid';
      const updateDto: UpdateSkillDto = { description: 'Updated Desc' };
      jest.spyOn(service, 'update').mockRejectedValue(new NotFoundException());
      await expect(controller.update(skillId, updateDto)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(skillId, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a skill', async () => {
      const skillId = 'uuid-1';
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);
      await controller.remove(skillId);
      expect(service.remove).toHaveBeenCalledWith(skillId);
    });

     it('should throw NotFoundException if service throws it', async () => {
      const skillId = 'not-found-uuid';
      jest.spyOn(service, 'remove').mockRejectedValue(new NotFoundException());
      await expect(controller.remove(skillId)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith(skillId);
    });
  });
});
