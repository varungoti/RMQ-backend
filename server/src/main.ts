import { NestFactory, Reflector, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, LogLevel, ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseWrapper } from './common/wrappers/response.wrapper';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';

declare const module: any;

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('Module search paths:', module.paths);

async function bootstrap() {
  const bootstrapLogger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
      abortOnError: false,
    });
    
    const configService = app.get(ConfigService);
    const reflector = app.get(Reflector);
    const httpAdapterHost = app.get(HttpAdapterHost);

    const isDevelopment = configService.get<string>('NODE_ENV') !== 'production';

    if (isDevelopment) {
      bootstrapLogger.log('Running in development mode');
    }

    // Setup RabbitMQ microservice
    const rabbitmqUrl = configService.get<string>('RABBITMQ_URL') || 'amqp://rmquser:rmqpassword@localhost:5672';
    bootstrapLogger.log(`Setting up RabbitMQ microservice with URL: ${rabbitmqUrl}`);
    
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
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
      origin: configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    // Disabled transformation interceptor
    // app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

    // Apply Global Filter BEFORE Global Interceptor
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

    // Register global HTTP exception filter for consistent error responses
    app.useGlobalFilters(new HttpExceptionFilter());

    // Set up global prefix 
    app.setGlobalPrefix('api');

    // Set up Swagger documentation with enhanced options
    const swaggerConfig = new DocumentBuilder()
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

    const document = SwaggerModule.createDocument(app, swaggerConfig, {
      extraModels: [ResponseWrapper],
    });
    
    // Export the Swagger JSON to a file for external tooling
    const outputPath = path.resolve(process.cwd(), 'swagger-spec.json');
    fs.writeFileSync(outputPath, JSON.stringify(document, null, 2), { encoding: 'utf8' });
    
    // Set up the Swagger UI endpoint
    SwaggerModule.setup('api/docs', app, document, {
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

    // Start microservices
    await app.startAllMicroservices();
    bootstrapLogger.log('RabbitMQ microservice started');

    const port = configService.get<number>('PORT') || 3001;
    await app.listen(port);
    bootstrapLogger.log(`Application is running on: http://localhost:${port}/api`);
    bootstrapLogger.log(`Swagger documentation is available at: http://localhost:${port}/api/docs`);

  } catch (error) {
    bootstrapLogger.error('Error during application bootstrap:', error.message, error.stack);
    process.exit(1);
  }
}

bootstrap();