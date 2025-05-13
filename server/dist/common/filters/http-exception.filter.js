"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const response_wrapper_1 = require("../wrappers/response.wrapper");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(HttpExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception.getStatus();
        const errorResponse = exception.getResponse();
        let errorMessage = 'Internal server error';
        if (typeof errorResponse === 'string') {
            errorMessage = errorResponse;
        }
        else if (typeof errorResponse === 'object' && errorResponse !== null) {
            if ('message' in errorResponse) {
                const message = errorResponse['message'];
                if (Array.isArray(message)) {
                    errorMessage = message.join(', ');
                }
                else if (typeof message === 'string') {
                    errorMessage = message;
                }
            }
        }
        const logMethod = status >= common_1.HttpStatus.INTERNAL_SERVER_ERROR
            ? this.logger.error.bind(this.logger)
            : status >= common_1.HttpStatus.BAD_REQUEST
                ? this.logger.warn.bind(this.logger)
                : this.logger.log.bind(this.logger);
        logMethod(`[${request.method}] ${request.url} - ${status} ${errorMessage}`, exception.stack);
        response.status(status).json(response_wrapper_1.ResponseWrapper.error(errorMessage));
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(common_1.HttpException)
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map