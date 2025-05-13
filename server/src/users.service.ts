import {
  Injectable,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Find a user by their email address.
   * @param email - The email to search for.
   * @returns The user object or null if not found.
   */
  async findOneByEmail(email: string): Promise<User | null> {
    this.logger.log(`Attempting to find user by email: ${email}`);
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      this.logger.warn(`User with email ${email} not found.`);
    }
    return user;
  }

  /**
   * Create a new user using data from CreateUserDto.
   * Hashes the password before saving.
   * @param createUserDto - DTO containing user creation data.
   * @returns The newly created user object (excluding password hash for security).
   * @throws ConflictException if the email already exists.
   */
  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    this.logger.log(`Attempting to create user with email: ${createUserDto.email}`);
    const existingUser = await this.findOneByEmail(createUserDto.email);
    if (existingUser) {
      this.logger.error(`Email ${createUserDto.email} already exists.`);
      throw new ConflictException('Email already exists');
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(createUserDto.password, this.saltRounds);
    this.logger.log(`Password hashed for email: ${createUserDto.email}`);

    // Create user entity
    const newUser = this.usersRepository.create({
      email: createUserDto.email,
      passwordHash: passwordHash,
      role: createUserDto.role || UserRole.STUDENT, // Default to STUDENT based on entity definition
      gradeLevel: createUserDto.gradeLevel, // Add gradeLevel from DTO
    });

    try {
      const savedUser: User = await this.usersRepository.save(newUser);
      this.logger.log(`User created successfully with ID: ${savedUser.id}`);
      // Exclude password hash from the returned object
      const { passwordHash: _, ...userWithoutPassword } = savedUser;
      return userWithoutPassword;
    } catch (error) {
      this.logger.error(`Failed to save user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find all users.
   * @returns An array of user objects (excluding password hash).
   */
  async findAll(): Promise<Omit<User, 'passwordHash'>[]> {
    this.logger.log('Fetching all users');
    const users = await this.usersRepository.find();
    // Exclude password hash from each user
    return users.map(({ passwordHash, ...user }) => user);
  }

  /**
   * Find a user by their ID.
   * Renamed from findById to findOne for consistency with controller.
   * @param id - The ID (UUID string) of the user to find.
   * @returns The user object (excluding password hash) or throws NotFoundException.
   */
  async findOne(id: string): Promise<Omit<User, 'passwordHash'>> {
    this.logger.log(`Attempting to find user by ID: ${id}`);
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      this.logger.warn(`User with ID ${id} not found.`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update a user by their ID.
   * @param id - The ID of the user to update.
   * @param updateUserDto - DTO containing updated user data.
   * @returns The updated user object (excluding password hash) or throws NotFoundException.
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<Omit<User, 'passwordHash'> | null> {
    this.logger.log(`Attempting to update user with ID: ${id}`);
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      this.logger.warn(`User with ID ${id} not found for update.`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check for email conflict if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.findOneByEmail(updateUserDto.email);
        if (existingUser && existingUser.id !== id) {
            this.logger.error(`Update failed: Email ${updateUserDto.email} already exists for another user.`);
            throw new ConflictException('Email already exists');
        }
    }

    // If password is provided in DTO, hash it
    let passwordHash: string | undefined;
    if (updateUserDto.password) {
      passwordHash = await bcrypt.hash(updateUserDto.password, this.saltRounds);
      this.logger.log(`Password hash updated for user ID: ${id}`);
    }

    // Prepare the update object, merging existing data with DTO data
    const updatePayload = {
      ...updateUserDto,
      ...(passwordHash && { passwordHash }), // Include hashed password if provided
    };

    // Remove password from updatePayload if it was only used for hashing
    delete updatePayload.password;

    try {
        await this.usersRepository.update(id, updatePayload);
        this.logger.log(`User with ID ${id} updated successfully.`);
        // Fetch the updated user to return it (excluding password hash)
        const updatedUser = await this.findOne(id);
        return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to update user ${id}: ${error.message}`, error.stack);
      // Re-throw or handle specific DB errors
      throw error;
    }
  }

  /**
   * Remove a user by their ID.
   * @param id - The ID of the user to remove.
   * @returns void or throws NotFoundException.
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Attempting to remove user with ID: ${id}`);
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      this.logger.warn(`User with ID ${id} not found for removal.`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    this.logger.log(`User with ID ${id} removed successfully.`);
  }

  // Keep findById internally if needed by other services, but expose findOne
  /**
   * Find a user by their ID (includes password hash).
   * Kept for internal use if needed (e.g., by AuthService).
   * @param id - The ID (UUID string) of the user to find.
   * @returns The full user object or null if not found.
   */
  async findByIdInternal(id: string): Promise<User | null> {
    this.logger.log(`Internal lookup for user by ID: ${id}`);
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      this.logger.warn(`Internal lookup: User with ID ${id} not found.`);
    }
    return user;
  }
}
