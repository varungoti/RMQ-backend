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
var MessagingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingService = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const rxjs_1 = require("rxjs");
let MessagingService = MessagingService_1 = class MessagingService {
    constructor(client) {
        this.client = client;
        this.logger = new common_1.Logger(MessagingService_1.name);
    }
    async onModuleInit() {
        try {
            await this.client.connect();
            this.logger.log('Connected to RabbitMQ');
        }
        catch (error) {
            this.logger.error(`Failed to connect to RabbitMQ: ${error.message}`, error.stack);
        }
    }
    async sendMessage(pattern, data) {
        try {
            this.logger.debug(`Sending message to pattern: ${pattern}`, JSON.stringify(data));
            const response = await (0, rxjs_1.lastValueFrom)(this.client.send(pattern, data));
            this.logger.debug(`Received response from pattern: ${pattern}`, JSON.stringify(response));
            return response;
        }
        catch (error) {
            this.logger.error(`Error sending message to pattern: ${pattern}`, error.stack);
            throw error;
        }
    }
    async emitEvent(pattern, data) {
        try {
            this.logger.debug(`Emitting event to pattern: ${pattern}`, JSON.stringify(data));
            this.client.emit(pattern, data);
        }
        catch (error) {
            this.logger.error(`Error emitting event to pattern: ${pattern}`, error.stack);
            throw error;
        }
    }
};
exports.MessagingService = MessagingService;
exports.MessagingService = MessagingService = MessagingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('RABBITMQ_CLIENT')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy])
], MessagingService);
//# sourceMappingURL=messaging.service.js.map