"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyResponseInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const class_validator_1 = require("class-validator");
const response_helper_1 = require("../utils/response-helper");
let LegacyResponseInterceptor = class LegacyResponseInterceptor {
    intercept(context, next) {
        return next.handle().pipe((0, operators_1.map)(response => {
            if (response === null || response === undefined) {
                return response;
            }
            if ((0, response_helper_1.isHybridResponse)(response)) {
                return response;
            }
            if (this.isWrappedResponse(response)) {
                const { success, data, message } = response;
                return (0, response_helper_1.createHybridResponse)(data, message, success);
            }
            return response;
        }));
    }
    isWrappedResponse(response) {
        if (!(0, class_validator_1.isObject)(response)) {
            return false;
        }
        return ('success' in response &&
            'data' in response &&
            'message' in response &&
            typeof response.success === 'boolean');
    }
};
exports.LegacyResponseInterceptor = LegacyResponseInterceptor;
exports.LegacyResponseInterceptor = LegacyResponseInterceptor = __decorate([
    (0, common_1.Injectable)()
], LegacyResponseInterceptor);
//# sourceMappingURL=legacy-response.interceptor.js.map