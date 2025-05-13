import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';

// Mock data consistent with User entity and previous tests
const mockUser: User = {
  id: 'mock-uuid-1',
  email: 'test@example.com',
  passwordHash: 'hashedpassword',
  role: UserRole.STUDENT,
  gradeLevel: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
  assessmentSessions: [],
};

const mockUser2: User = {
  id: 'mock-uuid-2',
  email: 'test2@example.com',
  passwordHash: 'hashedpassword2',
  role: UserRole.TEACHER,
  gradeLevel: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  assessmentSessions: [],
};

const createUserDtoMock: CreateUserDto = {
  email: 'new@example.com',
  password: 'newpassword123',
  gradeLevel: 5,
};

const updateUserDtoMock: UpdateUserDto = {
  role: UserRole.TEACHER,
};

const updateUserDtoWithPasswordMock: UpdateUserDto = {
  role: UserRole.TEACHER,
  password: 'newSecurePassword',
};

const updateUserDtoWithEmailMock: UpdateUserDto = {
  email: 'updated-email@example.com',
};

describe('UsersService', () => {
  let service: UsersService;
  let repository: Partial<Record<keyof Repository<User>, jest.Mock>>;

  // Define the simplified mock object directly
  const mockUserRepository = {
    findOneBy: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    // Add preload if SkillsService tests require it, or handle its absence
    // preload: jest.fn(), 
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // Reset individual mocks on the object
    Object.values(mockUserRepository).forEach(mockFn => mockFn.mockReset());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          // Use the simplified mock object directly
          useValue: mockUserRepository, 
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    // Get the injected mock object
    repository = module.get(getRepositoryToken(User)); 
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneByEmail', () => {
    it('should call repository.findOneBy with correct email', async () => {
      repository.findOneBy.mockResolvedValue(mockUser);
      await service.findOneByEmail(mockUser.email);
      expect(repository.findOneBy).toHaveBeenCalledWith({ email: mockUser.email });
    });

    it('should return the user found by repository', async () => {
      repository.findOneBy.mockResolvedValue(mockUser);
      const result = await service.findOneByEmail(mockUser.email);
      expect(result).toEqual(mockUser);
    });

    it('should return null if repository does not find user', async () => {
      repository.findOneBy.mockResolvedValue(null);
      const result = await service.findOneByEmail('unknown@example.com');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    beforeEach(() => {
      repository.findOneBy.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedNewPassword' as never);
      repository.create.mockImplementation(dto => ({ ...dto, id: 'temp-id' }));
      repository.save.mockImplementation(user => Promise.resolve({ ...user, id: 'new-uuid' }));
    });
    
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should check if email exists using findOneByEmail', async () => {
      await service.create(createUserDtoMock);
      expect(repository.findOneBy).toHaveBeenCalledWith({ email: createUserDtoMock.email });
    });

    it('should throw ConflictException if email already exists', async () => {
      repository.findOneBy.mockResolvedValue(mockUser);
      await expect(service.create(createUserDtoMock)).rejects.toThrow(ConflictException);
    });
    
    it('should hash the password using bcrypt', async () => {
      await service.create(createUserDtoMock);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDtoMock.password, 10);
    });

    it('should call repository.create with hashed password and default role/grade', async () => {
      await service.create(createUserDtoMock);
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        email: createUserDtoMock.email,
        passwordHash: 'hashedNewPassword',
        role: UserRole.STUDENT,
        gradeLevel: createUserDtoMock.gradeLevel,
      }));
    });

    it('should call repository.save with the created user entity', async () => {
      const createdEntity = { email: 'test', passwordHash: 'hash', role: UserRole.STUDENT, gradeLevel: 5 };
      repository.create.mockReturnValue(createdEntity);
      await service.create(createUserDtoMock);
      expect(repository.save).toHaveBeenCalledWith(createdEntity);
    });

    it('should return the saved user without the password hash', async () => {
      const result = await service.create(createUserDtoMock);
      expect(result).toBeDefined();
      expect((result as any).passwordHash).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should call repository.find()', async () => {
      repository.find.mockResolvedValue([mockUser, mockUser2]);
      await service.findAll();
      expect(repository.find).toHaveBeenCalled();
    });

    it('should return an array of users without password hashes', async () => {
      repository.find.mockResolvedValue([mockUser, mockUser2]);
      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(result[0].id).toEqual(mockUser.id);
      expect((result[0] as any).passwordHash).toBeUndefined();
      expect(result[1].id).toEqual(mockUser2.id);
      expect((result[1] as any).passwordHash).toBeUndefined();
    });
  });

  describe('findOne', () => {
    it('should call repository.findOneBy with the correct id', async () => {
      repository.findOneBy.mockResolvedValue(mockUser);
      await service.findOne(mockUser.id);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: mockUser.id });
    });

    it('should return the user without password hash if found', async () => {
      repository.findOneBy.mockResolvedValue(mockUser);
      const result = await service.findOne(mockUser.id);
      expect(result.id).toEqual(mockUser.id);
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('unknown-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      repository.findOneBy.mockResolvedValue(mockUser);
      repository.update.mockResolvedValue({ affected: 1 } as any);
      repository.findOneBy
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValue({ ...mockUser, role: updateUserDtoMock.role });
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedUpdatedPassword' as never);
    });
    
    afterEach(() => {
      jest.restoreAllMocks();
    });
    
    it('should find the user by id first', async () => {
      await service.update(mockUser.id, updateUserDtoMock);
      expect(repository.findOneBy).toHaveBeenNthCalledWith(1, { id: mockUser.id });
    });

    it('should throw NotFoundException if user to update is not found', async () => {
      repository.findOneBy.mockReset().mockResolvedValue(null);
      await expect(service.update('unknown-id', updateUserDtoMock)).rejects.toThrow(NotFoundException);
    });

    it('should check for email conflict if email is being updated', async () => {
      repository.findOneBy
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValue(null)
        .mockResolvedValue({ ...mockUser, email: updateUserDtoWithEmailMock.email });
      await service.update(mockUser.id, updateUserDtoWithEmailMock);
      expect(repository.findOneBy).toHaveBeenCalledWith({ email: updateUserDtoWithEmailMock.email });
    });

    it('should throw ConflictException if updated email exists for another user', async () => {
      repository.findOneBy
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValue({ ...mockUser2, email: updateUserDtoWithEmailMock.email });
      await expect(service.update(mockUser.id, updateUserDtoWithEmailMock)).rejects.toThrow(ConflictException);
    });
    
    it('should NOT check for email conflict if email is not in DTO', async () => {
      await service.update(mockUser.id, updateUserDtoMock);
      expect(repository.findOneBy).toHaveBeenCalledTimes(2);
      expect(repository.findOneBy).not.toHaveBeenCalledWith(expect.objectContaining({ email: expect.any(String) }));
    });
    
    it('should NOT check for email conflict if email in DTO is same as existing', async () => {
      const dtoWithSameEmail = { email: mockUser.email, role: UserRole.ADMIN };
      await service.update(mockUser.id, dtoWithSameEmail);
      expect(repository.findOneBy).toHaveBeenCalledTimes(2);
      const emailCheckCall = repository.findOneBy.mock.calls.find(call => call[0].email);
      expect(emailCheckCall).toBeUndefined();
    });

    it('should hash password if provided in DTO', async () => {
      await service.update(mockUser.id, updateUserDtoWithPasswordMock);
      expect(bcrypt.hash).toHaveBeenCalledWith(updateUserDtoWithPasswordMock.password, 10);
    });

    it('should NOT hash password if not provided in DTO', async () => {
      await service.update(mockUser.id, updateUserDtoMock);
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should call repository.update with correct payload (including hashed password)', async () => {
      await service.update(mockUser.id, updateUserDtoWithPasswordMock);
      const expectedPayload = { 
        role: updateUserDtoWithPasswordMock.role,
        passwordHash: 'hashedUpdatedPassword'
      };
      expect(repository.update).toHaveBeenCalledWith(mockUser.id, expectedPayload);
    });
    
    it('should call repository.update with correct payload (without password)', async () => {
      await service.update(mockUser.id, updateUserDtoMock);
      const expectedPayload = { 
        role: updateUserDtoMock.role
      };
      expect(repository.update).toHaveBeenCalledWith(mockUser.id, expectedPayload);
    });

    it('should fetch and return the updated user without password hash', async () => {
      const expectedUpdatedUser = { ...mockUser, role: updateUserDtoMock.role };
      repository.findOneBy.mockReset()
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValue(expectedUpdatedUser);
      
      const result = await service.update(mockUser.id, updateUserDtoMock);
      
      expect(repository.findOneBy).toHaveBeenNthCalledWith(2, { id: mockUser.id });
      expect(result).toBeDefined();
      expect(result.id).toEqual(mockUser.id);
      expect(result.role).toEqual(updateUserDtoMock.role);
      expect(result.gradeLevel).toEqual(mockUser.gradeLevel);
      expect((result as any).passwordHash).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('should call repository.delete with the correct id', async () => {
      repository.delete.mockResolvedValue({ affected: 1 } as any);
      await service.remove(mockUser.id);
      expect(repository.delete).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException if delete result affected is 0', async () => {
      repository.delete.mockResolvedValue({ affected: 0 } as any);
      await expect(service.remove('unknown-id')).rejects.toThrow(NotFoundException);
    });

    it('should not throw an error if delete is successful (affected > 0)', async () => {
      repository.delete.mockResolvedValue({ affected: 1 } as any);
      await expect(service.remove(mockUser.id)).resolves.not.toThrow();
    });
  });

});
