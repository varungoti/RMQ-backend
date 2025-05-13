"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const all_exceptions_filter_1 = require("./filters/all-exceptions.filter");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const response_wrapper_1 = require("./common/wrappers/response.wrapper");
const microservices_1 = require("@nestjs/microservices");
const fs = require("fs");
const path = require("path");
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
console.log('Module search paths:', module.paths);
async function bootstrap() {
    const bootstrapLogger = new common_1.Logger('Bootstrap');
    try {
        const app = await core_1.NestFactory.create(app_module_1.AppModule, {
            logger: ['error', 'warn', 'log', 'debug', 'verbose'],
            abortOnError: false,
        });
        const configService = app.get(config_1.ConfigService);
        const reflector = app.get(core_1.Reflector);
        const httpAdapterHost = app.get(core_1.HttpAdapterHost);
        const isDevelopment = configService.get('NODE_ENV') !== 'production';
        if (isDevelopment) {
            bootstrapLogger.log('Running in development mode');
        }
        const rabbitmqUrl = configService.get('RABBITMQ_URL') || 'amqp://rmquser:rmqpassword@localhost:5672';
        bootstrapLogger.log(`Setting up RabbitMQ microservice with URL: ${rabbitmqUrl}`);
        app.connectMicroservice({
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [rabbitmqUrl],
                queue: 'assessment_queue',
                queueOptions: {
                    durable: true,
                },
                prefetchCount: 1,
            },
        });
        bootstrapLogger.log(`Enabling CORS to reflect request origin`);
        app.enableCors({
            origin: configService.get('CORS_ORIGIN') || 'http://localhost:3000',
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
            credentials: true,
        });
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }));
        app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter(httpAdapterHost));
        app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
        app.setGlobalPrefix('api');
        const swaggerConfig = new swagger_1.DocumentBuilder()
            .setTitle('Assessment API')
            .setDescription(`
        # Assessment API Documentation
        
        This API allows users to take assessments, submit answers, and track their progress in various skills.
        
        ## Key Features
        - Start assessment sessions
        - Submit answers and get immediate feedback
        - Track progress across multiple skills
        - View detailed assessment results
        
        ## Authentication
        All endpoints require a valid JWT token in the Authorization header.
        
        ## Error Handling
        The API uses standard HTTP status codes:
        - 200: Success
        - 201: Created
        - 400: Bad Request (validation errors)
        - 401: Unauthorized (missing/invalid token)
        - 403: Forbidden (insufficient permissions)
        - 404: Not Found
        - 500: Internal Server Error
      `)
            .setVersion('1.0')
            .addBearerAuth()
            .addTag('Assessment', 'Assessment core endpoints')
            .addTag('Authentication', 'User authentication endpoints')
            .addTag('Users', 'User management endpoints')
            .addTag('Skills', 'Skill management endpoints')
            .addTag('Questions', 'Question management endpoints')
            .addTag('Analytics', 'Assessment analytics endpoints')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig, {
            extraModels: [response_wrapper_1.ResponseWrapper],
        });
        const outputPath = path.resolve(process.cwd(), 'swagger-spec.json');
        fs.writeFileSync(outputPath, JSON.stringify(document, null, 2), { encoding: 'utf8' });
        swagger_1.SwaggerModule.setup('api/docs', app, document, {
            swaggerOptions: {
                persistAuthorization: true,
                tagsSorter: 'alpha',
                operationsSorter: 'alpha',
                docExpansion: 'none',
                filter: true,
            },
            customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info__contact { display: none }
        .swagger-ui .scheme-container { margin: 0 0 20px 0; padding: 15px 0 }
        .swagger-ui .info { margin: 15px 0 }
      `,
            customSiteTitle: 'Assessment API Documentation',
        });
        await app.startAllMicroservices();
        bootstrapLogger.log('RabbitMQ microservice started');
        const port = configService.get('PORT') || 3001;
        await app.listen(port);
        bootstrapLogger.log(`Application is running on: http://localhost:${port}/api`);
        bootstrapLogger.log(`Swagger documentation is available at: http://localhost:${port}/api/docs`);
    }
    catch (error) {
        bootstrapLogger.error('Error during application bootstrap:', error.message, error.stack);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map