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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiGeneratedRecommendationDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const recommendation_dto_1 = require("./recommendation.dto");
class AiGeneratedRecommendationDto {
}
exports.AiGeneratedRecommendationDto = AiGeneratedRecommendationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Explanation why this resource is recommended', example: 'This video clearly explains the steps for factoring quadratics, addressing your recent errors.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AiGeneratedRecommendationDto.prototype, "explanation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Catchy title for the learning resource', example: 'Master Quadratic Factoring in 10 Minutes!' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AiGeneratedRecommendationDto.prototype, "resourceTitle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Brief description of the learning resource', example: 'A quick video tutorial covering the AC method and difference of squares.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AiGeneratedRecommendationDto.prototype, "resourceDescription", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The type of resource suggested', enum: recommendation_dto_1.RecommendationType, example: recommendation_dto_1.RecommendationType.VIDEO }),
    (0, class_validator_1.IsEnum)(recommendation_dto_1.RecommendationType),
    __metadata("design:type", String)
], AiGeneratedRecommendationDto.prototype, "resourceType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'A valid URL to the learning resource', example: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:quadratics-multiplying-factoring/x2f8bb11595b61c86:factor-quadratics-strategy/v/factoring-quadratic-expressions' }),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], AiGeneratedRecommendationDto.prototype, "resourceUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The priority level assigned by the AI', enum: recommendation_dto_1.RecommendationPriority, example: recommendation_dto_1.RecommendationPriority.HIGH }),
    (0, class_validator_1.IsEnum)(recommendation_dto_1.RecommendationPriority),
    __metadata("design:type", String)
], AiGeneratedRecommendationDto.prototype, "priority", void 0);
//# sourceMappingURL=ai-recommendation.dto.js.map