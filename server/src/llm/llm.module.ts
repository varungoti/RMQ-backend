import { Module } from '@nestjs/common';
import { LlmFactoryService } from './llm-factory.service';
import { LlmCacheService } from './llm-cache.service';
import { LlmRedisCacheModule } from './llm-redis-cache.module';

@Module({
  imports: [LlmRedisCacheModule],
  providers: [LlmFactoryService, LlmCacheService],
  exports: [LlmFactoryService, LlmCacheService, LlmRedisCacheModule],
})
export class LlmModule {} 