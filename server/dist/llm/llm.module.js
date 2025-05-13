"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmModule = void 0;
const common_1 = require("@nestjs/common");
const llm_factory_service_1 = require("./llm-factory.service");
const llm_cache_service_1 = require("./llm-cache.service");
const llm_redis_cache_module_1 = require("./llm-redis-cache.module");
let LlmModule = class LlmModule {
};
exports.LlmModule = LlmModule;
exports.LlmModule = LlmModule = __decorate([
    (0, common_1.Module)({
        imports: [llm_redis_cache_module_1.LlmRedisCacheModule],
        providers: [llm_factory_service_1.LlmFactoryService, llm_cache_service_1.LlmCacheService],
        exports: [llm_factory_service_1.LlmFactoryService, llm_cache_service_1.LlmCacheService, llm_redis_cache_module_1.LlmRedisCacheModule],
    })
], LlmModule);
//# sourceMappingURL=llm.module.js.map