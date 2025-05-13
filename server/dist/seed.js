"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const bcrypt = require("bcrypt");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const user_entity_1 = require("./entities/user.entity");
const skill_entity_1 = require("./entities/skill.entity");
const user_entity_2 = require("./entities/user.entity");
const skill_entity_2 = require("./entities/skill.entity");
async function bootstrap() {
    const logger = new common_1.Logger('Seed');
    logger.log('Starting database seed...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const dataSource = app.get((0, typeorm_1.getConnectionToken)());
    try {
        logger.log('Creating admin user...');
        const adminExists = await dataSource.getRepository(user_entity_1.User).findOne({
            where: { email: 'admin@example.com' }
        });
        if (!adminExists) {
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash('Admin123!', salt);
            const admin = dataSource.getRepository(user_entity_1.User).create({
                email: 'admin@example.com',
                passwordHash: hashedPassword,
                firstName: 'Admin',
                lastName: 'User',
                gradeLevel: 12,
                role: user_entity_2.UserRole.ADMIN
            });
            await dataSource.getRepository(user_entity_1.User).save(admin);
            logger.log('Admin user created successfully.');
        }
        else {
            logger.log('Admin user already exists, skipping creation.');
        }
        logger.log('Creating sample skills...');
        const skillsCount = await dataSource.getRepository(skill_entity_1.Skill).count();
        if (skillsCount === 0) {
            const sampleSkills = [
                {
                    name: 'Addition',
                    subject: 'Mathematics',
                    category: 'Arithmetic',
                    description: 'Basic addition of whole numbers',
                    gradeLevel: 1,
                    status: skill_entity_2.SkillStatus.ACTIVE,
                    isPrimary: true,
                    isSecondary: false
                },
                {
                    name: 'Subtraction',
                    subject: 'Mathematics',
                    category: 'Arithmetic',
                    description: 'Basic subtraction of whole numbers',
                    gradeLevel: 1,
                    status: skill_entity_2.SkillStatus.ACTIVE,
                    isPrimary: true,
                    isSecondary: false
                },
                {
                    name: 'Multiplication',
                    subject: 'Mathematics',
                    category: 'Arithmetic',
                    description: 'Basic multiplication of whole numbers',
                    gradeLevel: 2,
                    status: skill_entity_2.SkillStatus.ACTIVE,
                    isPrimary: true,
                    isSecondary: false
                },
                {
                    name: 'Division',
                    subject: 'Mathematics',
                    category: 'Arithmetic',
                    description: 'Basic division of whole numbers',
                    gradeLevel: 2,
                    status: skill_entity_2.SkillStatus.ACTIVE,
                    isPrimary: true,
                    isSecondary: false
                },
                {
                    name: 'Fractions',
                    subject: 'Mathematics',
                    category: 'Numbers',
                    description: 'Understanding and using fractions',
                    gradeLevel: 3,
                    status: skill_entity_2.SkillStatus.ACTIVE,
                    isPrimary: true,
                    isSecondary: false
                }
            ];
            const skillsRepository = dataSource.getRepository(skill_entity_1.Skill);
            for (const skillData of sampleSkills) {
                const skill = skillsRepository.create(skillData);
                await skillsRepository.save(skill);
            }
            logger.log(`${sampleSkills.length} sample skills created successfully.`);
        }
        else {
            logger.log('Skills already exist, skipping creation.');
        }
        logger.log('Database seed completed successfully.');
    }
    catch (error) {
        logger.error(`Error during database seed: ${error.message}`, error.stack);
        throw error;
    }
    finally {
        await app.close();
    }
}
bootstrap();
//# sourceMappingURL=seed.js.map