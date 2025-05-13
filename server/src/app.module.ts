import { Module, Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import * as Joi from 'joi';
import { join } from 'path';
import { User } from './entities/user.entity';
import { Skill } from './entities/skill.entity';
import { Question } from './entities/question.entity';
import { AssessmentSession } from './entities/assessment_session.entity';
import { AssessmentResponse } from './entities/assessment_response.entity';
import { AssessmentSkillScore } from './entities/assessment_skill_score.entity';
import { RecommendationResource } from './entities/recommendation_resource.entity';
import { RecommendationHistory } from './entities/recommendation_history.entity';
import { UsersModule } from './users.module';
import { AuthModule } from './auth.module';
import { SkillsModule } from './skills.module';
import { QuestionsModule } from './questions.module';
import { AssessmentModule } from './assessment.module';
import { AnalyticsModule } from './analytics.module';
import { RecommendationsModule } from './recommendations.module';
import { MessagingModule } from './messaging/messaging.module';
import { AppResolver } from './app.resolver';
import * as fs from 'fs';
import { RedisModule } from './redis.module';
import { MetricsModule } from './metrics/metrics.module';

declare const module: any;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3001),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION_TIME: Joi.string().default('60m'),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_EXPIRATION_TIME: Joi.string().default('7d'),
        CORS_ORIGIN: Joi.string().uri().optional().default('http://localhost:3000'),
        SUPABASE_PROJECT_URL: Joi.string().uri().optional(),
        SUPABASE_ANON_KEY: Joi.string().optional(),
        RABBITMQ_URL: Joi.string().optional().default('amqp://rmquser:rmqpassword@localhost:5672'),
        REDIS_CACHE_ENABLED: Joi.boolean().default(false),
        REDIS_HOST: Joi.string().when('REDIS_CACHE_ENABLED', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        REDIS_PORT: Joi.number().when('REDIS_CACHE_ENABLED', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        REDIS_PASSWORD: Joi.string().optional(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const logger = new Logger('TypeORM');
        const isProd = configService.get<string>('NODE_ENV') === 'production';
        const isHMR = module.hot !== undefined;

        logger.log(`Initializing TypeORM (Production: ${isProd}, HMR: ${isHMR})`);

        let sslConfig: any = undefined;

        if (isProd) {
          // Explicitly load the Supabase CA certificate provided in the Docker image
          const caPath = '/usr/local/share/ca-certificates/prod-ca-2021.crt'; 
          try {
            const caContent = fs.readFileSync(caPath, 'utf8');
            sslConfig = {
              rejectUnauthorized: true, // Keep validation enabled
              ca: caContent, // Provide the Supabase CA content directly
            };
            logger.log(`Loaded Supabase CA certificate from ${caPath} for SSL.`);
          } catch (err) {
            logger.error(`Failed to read Supabase CA certificate from ${caPath}: ${err.message}. SSL connection will fail.`);
            // If reading fails, connection will likely fail anyway, but set a default
            sslConfig = { rejectUnauthorized: true }; 
          }
        } else {
          // Keep rejectUnauthorized false for non-prod if needed
          logger.log('Non-production environment detected, disabling rejectUnauthorized for SSL.');
          sslConfig = { rejectUnauthorized: false }; 
        }
        
        const config: TypeOrmModuleOptions = {
          type: 'postgres',
          url: configService.get<string>('DATABASE_URL'),
          entities: [
            User,
            Skill,
            Question,
            AssessmentSession,
            AssessmentResponse,
            AssessmentSkillScore,
            RecommendationResource,
            RecommendationHistory,
          ],
          synchronize: !isProd && !isHMR,
          logging: !isProd,
          ssl: sslConfig, // Use the determined SSL config
          cache: !isHMR,
          extra: {
            max: 20,
            connectionTimeoutMillis: 3000,
          }
        };

        // Updated logging to safely check for 'ca' property
        const isSSLObject = typeof config.ssl === 'object' && config.ssl !== null;
        logger.log(`TypeORM configuration loaded (synchronize: ${config.synchronize}, SSL enabled: ${!!config.ssl}, CA provided: ${isSSLObject && !!(config.ssl as any).ca})`);
        return config;
      },
      inject: [ConfigService],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
    }),
    RouterModule.register([
      // REMOVE the RouterModule entry for QuestionsModule
      // {
      //   path: 'questions',
      //   module: QuestionsModule,
      // },
    ]),
    UsersModule,
    AuthModule,
    SkillsModule,
    QuestionsModule,
    AssessmentModule,
    AnalyticsModule,
    RecommendationsModule,
    MessagingModule,
    RedisModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppResolver],
})
export class AppModule {}
