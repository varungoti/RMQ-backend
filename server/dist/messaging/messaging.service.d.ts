import { OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
export declare class MessagingService implements OnModuleInit {
    private readonly client;
    private readonly logger;
    constructor(client: ClientProxy);
    onModuleInit(): Promise<void>;
    sendMessage<T>(pattern: string, data: any): Promise<T>;
    emitEvent(pattern: string, data: any): Promise<void>;
}
