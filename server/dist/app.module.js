"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const graphql_1 = require("@nestjs/graphql");
const apollo_1 = require("@nestjs/apollo");
const Joi = require("joi");
const path_1 = require("path");
const user_entity_1 = require("./entities/user.entity");
const skill_entity_1 = require("./entities/skill.entity");
const question_entity_1 = require("./entities/question.entity");
const assessment_session_entity_1 = require("./entities/assessment_session.entity");
const assessment_response_entity_1 = require("./entities/assessment_response.entity");
const assessment_skill_score_entity_1 = require("./entities/assessment_skill_score.entity");
const recommendation_resource_entity_1 = require("./entities/recommendation_resource.entity");
const recommendation_history_entity_1 = require("./entities/recommendation_history.entity");
const users_module_1 = require("./users.module");
const auth_module_1 = require("./auth.module");
const skills_module_1 = require("./skills.module");
const questions_module_1 = require("./questions.module");
const assessment_module_1 = require("./assessment.module");
const analytics_module_1 = require("./analytics.module");
const recommendations_module_1 = require("./recommendations.module");
const messaging_module_1 = require("./messaging/messaging.module");
const app_resolver_1 = require("./app.resolver");
const fs = require("fs");
const redis_module_1 = require("./redis.module");
const metrics_module_1 = require("./metrics/metrics.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
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
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    const logger = new common_1.Logger('TypeORM');
                    const isProd = configService.get('NODE_ENV') === 'production';
                    const isHMR = module.hot !== undefined;
                    logger.log(`Initializing TypeORM (Production: ${isProd}, HMR: ${isHMR})`);
                    let sslConfig = undefined;
                    if (isProd) {
                        const caPath = '/usr/local/share/ca-certificates/prod-ca-2021.crt';
                        try {
                            const caContent = fs.readFileSync(caPath, 'utf8');
                            sslConfig = {
                                rejectUnauthorized: true,
                                ca: caContent,
                            };
                            logger.log(`Loaded Supabase CA certificate from ${caPath} for SSL.`);
                        }
                        catch (err) {
                            logger.error(`Failed to read Supabase CA certificate from ${caPath}: ${err.message}. SSL connection will fail.`);
                            sslConfig = { rejectUnauthorized: true };
                        }
                    }
                    else {
                        logger.log('Non-production environment detected, disabling rejectUnauthorized for SSL.');
                        sslConfig = { rejectUnauthorized: false };
                    }
                    const config = {
                        type: 'postgres',
                        url: configService.get('DATABASE_URL'),
                        entities: [
                            user_entity_1.User,
                            skill_entity_1.Skill,
                            question_entity_1.Question,
                            assessment_session_entity_1.AssessmentSession,
                            assessment_response_entity_1.AssessmentResponse,
                            assessment_skill_score_entity_1.AssessmentSkillScore,
                            recommendation_resource_entity_1.RecommendationResource,
                            recommendation_history_entity_1.RecommendationHistory,
                        ],
                        synchronize: !isProd && !isHMR,
                        logging: !isProd,
                        ssl: sslConfig,
                        cache: !isHMR,
                        extra: {
                            max: 20,
                            connectionTimeoutMillis: 3000,
                        }
                    };
                    const isSSLObject = typeof config.ssl === 'object' && config.ssl !== null;
                    logger.log(`TypeORM configuration loaded (synchronize: ${config.synchronize}, SSL enabled: ${!!config.ssl}, CA provided: ${isSSLObject && !!config.ssl.ca})`);
                    return config;
                },
                inject: [config_1.ConfigService],
            }),
            graphql_1.GraphQLModule.forRoot({
                driver: apollo_1.ApolloDriver,
                autoSchemaFile: (0, path_1.join)(process.cwd(), 'src/schema.gql'),
                sortSchema: true,
                playground: process.env.NODE_ENV !== 'production',
            }),
            core_1.RouterModule.register([]),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            skills_module_1.SkillsModule,
            questions_module_1.QuestionsModule,
            assessment_module_1.AssessmentModule,
            analytics_module_1.AnalyticsModule,
            recommendations_module_1.RecommendationsModule,
            messaging_module_1.MessagingModule,
            redis_module_1.RedisModule,
            metrics_module_1.MetricsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, app_resolver_1.AppResolver],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map