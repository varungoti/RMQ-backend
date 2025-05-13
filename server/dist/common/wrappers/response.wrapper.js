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
exports.ResponseWrapper = void 0;
const swagger_1 = require("@nestjs/swagger");
class ResponseWrapper {
    static success(data, message) {
        const response = new ResponseWrapper();
        response.success = true;
        response.data = data;
        if (message) {
            response.message = message;
        }
        return response;
    }
    static error(message) {
        const response = new ResponseWrapper();
        response.success = false;
        response.data = null;
        response.message = message;
        return response;
    }
}
exports.ResponseWrapper = ResponseWrapper;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indicates if the operation was successful',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ResponseWrapper.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The data returned by the operation',
        example: {},
    }),
    __metadata("design:type", Object)
], ResponseWrapper.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Additional information about the operation',
        example: 'Operation completed successfully',
        required: false,
    }),
    __metadata("design:type", String)
], ResponseWrapper.prototype, "message", void 0);
//# sourceMappingURL=response.wrapper.js.map