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
var SkillsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const skill_entity_1 = require("./entities/skill.entity");
let SkillsService = SkillsService_1 = class SkillsService {
    constructor(skillsRepository) {
        this.skillsRepository = skillsRepository;
        this.logger = new common_1.Logger(SkillsService_1.name);
    }
    async create(createSkillDto) {
        this.logger.log(`Creating skill: ${createSkillDto.name}`);
        try {
            const newSkill = this.skillsRepository.create(createSkillDto);
            const savedSkill = await this.skillsRepository.save(newSkill);
            this.logger.log(`Skill created successfully with ID: ${savedSkill.id}`);
            return savedSkill;
        }
        catch (error) {
            this.logger.error(`Failed to create skill: ${error.message}`, error.stack);
            throw error;
        }
    }
    async findAll() {
        this.logger.log('Retrieving all skills');
        try {
            const skills = await this.skillsRepository.find();
            this.logger.log(`Retrieved ${skills.length} skills.`);
            return skills;
        }
        catch (error) {
            this.logger.error(`Failed to retrieve skills: ${error.message}`, error.stack);
            throw error;
        }
    }
    async findOne(id) {
        this.logger.log(`Retrieving skill with ID: ${id}`);
        try {
            const skill = await this.skillsRepository.findOneByOrFail({ id });
            this.logger.log(`Skill with ID ${id} retrieved successfully.`);
            return skill;
        }
        catch (error) {
            this.logger.error(`Failed to retrieve skill with ID ${id}: ${error.message}`, error.stack);
            if (error.name === 'EntityNotFoundError') {
                throw new common_1.NotFoundException(`Skill with ID "${id}" not found`);
            }
            throw error;
        }
    }
    async update(id, updateSkillDto) {
        this.logger.log(`Attempting to update skill with ID: ${id}`);
        const skill = await this.skillsRepository.preload({
            id: id,
            ...updateSkillDto,
        });
        if (!skill) {
            this.logger.error(`Update failed: Skill with ID "${id}" not found.`);
            throw new common_1.NotFoundException(`Skill with ID "${id}" not found`);
        }
        try {
            const updatedSkill = await this.skillsRepository.save(skill);
            this.logger.log(`Skill with ID ${id} updated successfully.`);
            return updatedSkill;
        }
        catch (error) {
            this.logger.error(`Failed to update skill with ID ${id}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async remove(id) {
        this.logger.log(`Attempting to remove skill with ID: ${id}`);
        const result = await this.skillsRepository.delete(id);
        if (result.affected === 0) {
            this.logger.error(`Remove failed: Skill with ID "${id}" not found.`);
            throw new common_1.NotFoundException(`Skill with ID "${id}" not found`);
        }
        this.logger.log(`Skill with ID ${id} removed successfully.`);
    }
};
exports.SkillsService = SkillsService;
exports.SkillsService = SkillsService = SkillsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(skill_entity_1.Skill)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SkillsService);
//# sourceMappingURL=skills.service.js.map