import { NestFactory } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { User } from './entities/user.entity';
import { Skill } from './entities/skill.entity';
import { UserRole } from './entities/user.entity';
import { SkillStatus } from './entities/skill.entity';

async function bootstrap() {
  const logger = new Logger('Seed');
  logger.log('Starting database seed...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get<DataSource>(getConnectionToken());

  try {
    // Create admin user
    logger.log('Creating admin user...');
    const adminExists = await dataSource.getRepository(User).findOne({
      where: { email: 'admin@example.com' }
    });

    if (!adminExists) {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash('Admin123!', salt);
      
      const admin = dataSource.getRepository(User).create({
        email: 'admin@example.com',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        gradeLevel: 12, // Default high grade level for admin
        role: UserRole.ADMIN
      });
      
      await dataSource.getRepository(User).save(admin);
      logger.log('Admin user created successfully.');
    } else {
      logger.log('Admin user already exists, skipping creation.');
    }

    // Create sample skills
    logger.log('Creating sample skills...');
    const skillsCount = await dataSource.getRepository(Skill).count();
    
    if (skillsCount === 0) {
      const sampleSkills = [
        {
          name: 'Addition',
          subject: 'Mathematics',
          category: 'Arithmetic',
          description: 'Basic addition of whole numbers',
          gradeLevel: 1,
          status: SkillStatus.ACTIVE,
          isPrimary: true,
          isSecondary: false
        },
        {
          name: 'Subtraction',
          subject: 'Mathematics',
          category: 'Arithmetic',
          description: 'Basic subtraction of whole numbers',
          gradeLevel: 1,
          status: SkillStatus.ACTIVE,
          isPrimary: true,
          isSecondary: false
        },
        {
          name: 'Multiplication',
          subject: 'Mathematics',
          category: 'Arithmetic',
          description: 'Basic multiplication of whole numbers',
          gradeLevel: 2,
          status: SkillStatus.ACTIVE,
          isPrimary: true,
          isSecondary: false
        },
        {
          name: 'Division',
          subject: 'Mathematics',
          category: 'Arithmetic',
          description: 'Basic division of whole numbers',
          gradeLevel: 2,
          status: SkillStatus.ACTIVE,
          isPrimary: true,
          isSecondary: false
        },
        {
          name: 'Fractions',
          subject: 'Mathematics',
          category: 'Numbers',
          description: 'Understanding and using fractions',
          gradeLevel: 3,
          status: SkillStatus.ACTIVE,
          isPrimary: true,
          isSecondary: false
        }
      ];
      
      const skillsRepository = dataSource.getRepository(Skill);
      for (const skillData of sampleSkills) {
        const skill = skillsRepository.create(skillData);
        await skillsRepository.save(skill);
      }
      
      logger.log(`${sampleSkills.length} sample skills created successfully.`);
    } else {
      logger.log('Skills already exist, skipping creation.');
    }

    // Add more seed data as needed (questions, etc.)
    
    logger.log('Database seed completed successfully.');
  } catch (error) {
    logger.error(`Error during database seed: ${error.message}`, error.stack);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap(); 