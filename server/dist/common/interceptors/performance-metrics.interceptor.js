"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMetricsInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let PerformanceMetricsInterceptor = class PerformanceMetricsInterceptor {
    constructor() {
        this.logger = new common_1.Logger('PerformanceMetrics');
        this.WARN_THRESHOLD = 1000;
        this.ERROR_THRESHOLD = 3000;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const { method, url } = request;
        const startTime = Date.now();
        return next.handle().pipe((0, operators_1.tap)(() => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            if (duration > this.ERROR_THRESHOLD) {
                this.logger.error(`SLOW REQUEST [${method}] ${url} - ${duration}ms`);
            }
            else if (duration > this.WARN_THRESHOLD) {
                this.logger.warn(`SLOW REQUEST [${method}] ${url} - ${duration}ms`);
            }
            else {
                this.logger.log(`REQUEST [${method}] ${url} - ${duration}ms`);
            }
            const metricsData = {
                timestamp: new Date().toISOString(),
                method,
                url,
                duration,
                endpoint: this.normalizeEndpoint(url),
            };
        }));
    }
    normalizeEndpoint(url) {
        return url.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
            .replace(/\/[0-9]+/g, '/:id');
    }
};
exports.PerformanceMetricsInterceptor = PerformanceMetricsInterceptor;
exports.PerformanceMetricsInterceptor = PerformanceMetricsInterceptor = __decorate([
    (0, common_1.Injectable)()
], PerformanceMetricsInterceptor);
//# sourceMappingURL=performance-metrics.interceptor.js.map