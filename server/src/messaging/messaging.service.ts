import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class MessagingService implements OnModuleInit {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    @Inject('RABBITMQ_CLIENT') private readonly client: ClientProxy,
  ) {}

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('Connected to RabbitMQ');
    } catch (error) {
      this.logger.error(`Failed to connect to RabbitMQ: ${error.message}`, error.stack);
    }
  }

  async sendMessage<T>(pattern: string, data: any): Promise<T> {
    try {
      this.logger.debug(`Sending message to pattern: ${pattern}`, JSON.stringify(data));
      const response = await lastValueFrom(
        this.client.send<T, any>(pattern, data)
      );
      this.logger.debug(`Received response from pattern: ${pattern}`, JSON.stringify(response));
      return response;
    } catch (error) {
      this.logger.error(`Error sending message to pattern: ${pattern}`, error.stack);
      throw error;
    }
  }

  async emitEvent(pattern: string, data: any): Promise<void> {
    try {
      this.logger.debug(`Emitting event to pattern: ${pattern}`, JSON.stringify(data));
      this.client.emit(pattern, data);
    } catch (error) {
      this.logger.error(`Error emitting event to pattern: ${pattern}`, error.stack);
      throw error;
    }
  }
} 