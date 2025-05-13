"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorLoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
let ErrorLoggingInterceptor = class ErrorLoggingInterceptor {
    constructor() {
        this.logger = new common_1.Logger('ErrorLoggingInterceptor');
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const { method, url, body, params, query } = request;
        const userId = request.user?.id || 'anonymous';
        const startTime = Date.now();
        this.logger.log(`[${userId}] ${method} ${url} - Start - Params: ${JSON.stringify(params)} Query: ${JSON.stringify(query)} Body: ${method !== 'GET' ? JSON.stringify(body) : 'n/a'}`);
        return next.handle().pipe((0, operators_1.tap)(() => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            this.logger.log(`[${userId}] ${method} ${url} - Complete - Duration: ${duration}ms`);
        }), (0, operators_1.catchError)((error) => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            this.logger.error(`[${userId}] ${method} ${url} - Error - Duration: ${duration}ms - ${error.message}`, error.stack, {
                userId,
                method,
                url,
                params,
                query,
                body: method !== 'GET' ? body : undefined,
                statusCode: error.status || error.statusCode || 500,
                errorName: error.name,
                errorType: error instanceof common_1.HttpException ? 'HttpException' : 'UnhandledException',
            });
            return (0, rxjs_1.throwError)(() => error);
        }));
    }
};
exports.ErrorLoggingInterceptor = ErrorLoggingInterceptor;
exports.ErrorLoggingInterceptor = ErrorLoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], ErrorLoggingInterceptor);
//# sourceMappingURL=error-logging.interceptor.js.map