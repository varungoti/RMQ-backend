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
exports.FinishSessionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class FinishSessionDto {
}
exports.FinishSessionDto = FinishSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Assessment session ID to finish',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Assessment session ID is required' }),
    (0, class_validator_1.IsUUID)(4, { message: 'Assessment session ID must be a valid UUID v4' }),
    __metadata("design:type", String)
], FinishSessionDto.prototype, "assessmentSessionId", void 0);
//# sourceMappingURL=finish-session.dto.js.map