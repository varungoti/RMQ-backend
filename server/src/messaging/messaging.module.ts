import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { AssessmentModule } from '../assessment.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'assessment_queue',
          queueOptions: {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': 'assessment_dlx',
              'x-dead-letter-routing-key': 'assessment.dead-letter',
            },
          },
          prefetchCount: 1,
        },
      },
      {
        name: 'DEAD_LETTER_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'assessment_dead_letter',
          queueOptions: {
            durable: true,
          },
          prefetchCount: 1,
        },
      },
    ]),
    AssessmentModule,
  ],
  controllers: [MessagingController],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {} 