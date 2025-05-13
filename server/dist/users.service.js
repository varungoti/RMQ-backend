"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const user_entity_1 = require("./entities/user.entity");
let UsersService = UsersService_1 = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
        this.logger = new common_1.Logger(UsersService_1.name);
        this.saltRounds = 10;
    }
    async findOneByEmail(email) {
        this.logger.log(`Attempting to find user by email: ${email}`);
        const user = await this.usersRepository.findOne({ where: { email } });
        if (!user) {
            this.logger.warn(`User with email ${email} not found.`);
        }
        return user;
    }
    async create(createUserDto) {
        this.logger.log(`Attempting to create user with email: ${createUserDto.email}`);
        const existingUser = await this.findOneByEmail(createUserDto.email);
        if (existingUser) {
            this.logger.error(`Email ${createUserDto.email} already exists.`);
            throw new common_1.ConflictException('Email already exists');
        }
        const passwordHash = await bcrypt.hash(createUserDto.password, this.saltRounds);
        this.logger.log(`Password hashed for email: ${createUserDto.email}`);
        const newUser = this.usersRepository.create({
            email: createUserDto.email,
            passwordHash: passwordHash,
            role: createUserDto.role || user_entity_1.UserRole.STUDENT,
            gradeLevel: createUserDto.gradeLevel,
        });
        try {
            const savedUser = await this.usersRepository.save(newUser);
            this.logger.log(`User created successfully with ID: ${savedUser.id}`);
            const { passwordHash: _, ...userWithoutPassword } = savedUser;
            return userWithoutPassword;
        }
        catch (error) {
            this.logger.error(`Failed to save user: ${error.message}`, error.stack);
            throw error;
        }
    }
    async findAll() {
        this.logger.log('Fetching all users');
        const users = await this.usersRepository.find();
        return users.map(({ passwordHash, ...user }) => user);
    }
    async findOne(id) {
        this.logger.log(`Attempting to find user by ID: ${id}`);
        const user = await this.usersRepository.findOneBy({ id });
        if (!user) {
            this.logger.warn(`User with ID ${id} not found.`);
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async update(id, updateUserDto) {
        this.logger.log(`Attempting to update user with ID: ${id}`);
        const user = await this.usersRepository.findOneBy({ id });
        if (!user) {
            this.logger.warn(`User with ID ${id} not found for update.`);
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existingUser = await this.findOneByEmail(updateUserDto.email);
            if (existingUser && existingUser.id !== id) {
                this.logger.error(`Update failed: Email ${updateUserDto.email} already exists for another user.`);
                throw new common_1.ConflictException('Email already exists');
            }
        }
        let passwordHash;
        if (updateUserDto.password) {
            passwordHash = await bcrypt.hash(updateUserDto.password, this.saltRounds);
            this.logger.log(`Password hash updated for user ID: ${id}`);
        }
        const updatePayload = {
            ...updateUserDto,
            ...(passwordHash && { passwordHash }),
        };
        delete updatePayload.password;
        try {
            await this.usersRepository.update(id, updatePayload);
            this.logger.log(`User with ID ${id} updated successfully.`);
            const updatedUser = await this.findOne(id);
            return updatedUser;
        }
        catch (error) {
            this.logger.error(`Failed to update user ${id}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async remove(id) {
        this.logger.log(`Attempting to remove user with ID: ${id}`);
        const result = await this.usersRepository.delete(id);
        if (result.affected === 0) {
            this.logger.warn(`User with ID ${id} not found for removal.`);
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        this.logger.log(`User with ID ${id} removed successfully.`);
    }
    async findByIdInternal(id) {
        this.logger.log(`Internal lookup for user by ID: ${id}`);
        const user = await this.usersRepository.findOneBy({ id });
        if (!user) {
            this.logger.warn(`Internal lookup: User with ID ${id} not found.`);
        }
        return user;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map