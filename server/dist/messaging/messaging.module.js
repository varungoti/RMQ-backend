"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingModule = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const messaging_service_1 = require("./messaging.service");
const messaging_controller_1 = require("./messaging.controller");
const assessment_module_1 = require("../assessment.module");
let MessagingModule = class MessagingModule {
};
exports.MessagingModule = MessagingModule;
exports.MessagingModule = MessagingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            microservices_1.ClientsModule.register([
                {
                    name: 'RABBITMQ_SERVICE',
                    transport: microservices_1.Transport.RMQ,
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
                    transport: microservices_1.Transport.RMQ,
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
            assessment_module_1.AssessmentModule,
        ],
        controllers: [messaging_controller_1.MessagingController],
        providers: [messaging_service_1.MessagingService],
        exports: [messaging_service_1.MessagingService],
    })
], MessagingModule);
//# sourceMappingURL=messaging.module.js.map