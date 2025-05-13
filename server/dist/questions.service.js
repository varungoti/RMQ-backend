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
var QuestionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const question_entity_1 = require("./entities/question.entity");
const skill_entity_1 = require("./entities/skill.entity");
let QuestionsService = QuestionsService_1 = class QuestionsService {
    constructor(questionsRepository, skillsRepository) {
        this.questionsRepository = questionsRepository;
        this.skillsRepository = skillsRepository;
        this.logger = new common_1.Logger(QuestionsService_1.name);
    }
    async create(createQuestionDto) {
        this.logger.log(`Attempting to create question for skill ID: ${createQuestionDto.primarySkillId}`);
        const skill = await this.skillsRepository.findOneBy({ id: createQuestionDto.primarySkillId });
        if (!skill) {
            this.logger.warn(`Skill not found for ID: ${createQuestionDto.primarySkillId}`);
            throw new common_1.NotFoundException(`Skill with ID ${createQuestionDto.primarySkillId} not found`);
        }
        try {
            const newQuestion = this.questionsRepository.create({
                ...createQuestionDto,
                primarySkill: skill,
                status: createQuestionDto.status ?? question_entity_1.QuestionStatus.DRAFT,
            });
            const savedQuestion = await this.questionsRepository.save(newQuestion);
            this.logger.log(`Successfully created question with ID: ${savedQuestion.id}`);
            return savedQuestion;
        }
        catch (error) {
            this.logger.error(`Failed to create question: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to create question.');
        }
    }
    async findAll() {
        this.logger.log('Fetching all questions');
        try {
            return await this.questionsRepository.find({ relations: ['primarySkill'] });
        }
        catch (error) {
            this.logger.error(`Failed to fetch all questions: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to retrieve questions.');
        }
    }
    async findOne(id) {
        this.logger.log(`Fetching question with ID: ${id}`);
        try {
            const question = await this.questionsRepository.findOne({
                where: { id },
                relations: ['primarySkill']
            });
            if (!question) {
                throw new common_1.NotFoundException(`Question with ID ${id} not found`);
            }
            return question;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to fetch question ID ${id}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException(`Failed to retrieve question ID ${id}.`);
        }
    }
    async update(id, updateQuestionDto) {
        this.logger.log(`Attempting to update question ID: ${id}`);
        const existingQuestion = await this.findOne(id);
        let skill = undefined;
        if (updateQuestionDto.primarySkillId) {
            skill = await this.skillsRepository.findOneBy({ id: updateQuestionDto.primarySkillId });
            if (!skill) {
                this.logger.warn(`Skill not found for ID during update: ${updateQuestionDto.primarySkillId}`);
                throw new common_1.NotFoundException(`Skill with ID ${updateQuestionDto.primarySkillId} not found`);
            }
        }
        try {
            const dtoToMerge = { ...updateQuestionDto };
            delete dtoToMerge.primarySkillId;
            this.questionsRepository.merge(existingQuestion, dtoToMerge);
            if (skill) {
                existingQuestion.primarySkill = skill;
            }
            const updatedQuestion = await this.questionsRepository.save(existingQuestion);
            this.logger.log(`Successfully updated question ID: ${id}`);
            return updatedQuestion;
        }
        catch (error) {
            this.logger.error(`Failed to update question ID ${id}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException(`Failed to update question ID ${id}.`);
        }
    }
    async remove(id) {
        this.logger.log(`Attempting to remove question ID: ${id}`);
        const result = await this.questionsRepository.delete({ id });
        if (result.affected === 0) {
            this.logger.error(`Remove failed: Question with ID "${id}" not found.`);
            throw new common_1.NotFoundException(`Question with ID "${id}" not found`);
        }
        this.logger.log(`Successfully removed question ID: ${id}`);
    }
};
exports.QuestionsService = QuestionsService;
exports.QuestionsService = QuestionsService = QuestionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(question_entity_1.Question)),
    __param(1, (0, typeorm_1.InjectRepository)(skill_entity_1.Skill)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], QuestionsService);
//# sourceMappingURL=questions.service.js.map