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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AssessmentOwnerGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentOwnerGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const assessment_session_entity_1 = require("../entities/assessment_session.entity");
let AssessmentOwnerGuard = AssessmentOwnerGuard_1 = class AssessmentOwnerGuard {
    constructor(reflector, assessmentSessionRepository) {
        this.reflector = reflector;
        this.assessmentSessionRepository = assessmentSessionRepository;
        this.logger = new common_1.Logger(AssessmentOwnerGuard_1.name);
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const sessionId = request.params.sessionId;
        if (!user || !user.id) {
            this.logger.warn('AssessmentOwnerGuard: User not found on request.');
            return false;
        }
        if (!sessionId) {
            this.logger.warn('AssessmentOwnerGuard: Session ID not found in request params.');
            return false;
        }
        try {
            const session = await this.assessmentSessionRepository.findOne({
                where: { id: sessionId },
                relations: ['user'],
            });
            if (!session) {
                this.logger.warn(`AssessmentOwnerGuard: Session ${sessionId} not found.`);
                throw new common_1.NotFoundException(`Assessment session with ID ${sessionId} not found.`);
            }
            if (session.user.id !== user.id) {
                this.logger.warn(`AssessmentOwnerGuard: User ${user.id} does not own session ${sessionId}. Owner is ${session.user.id}.`);
                throw new common_1.ForbiddenException('You do not have permission to access this assessment session.');
            }
            this.logger.log(`AssessmentOwnerGuard: User ${user.id} verified as owner of session ${sessionId}.`);
            return true;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException) {
                throw error;
            }
            this.logger.error(`AssessmentOwnerGuard: Error checking ownership for session ${sessionId}, user ${user.id}: ${error.message}`, error.stack);
            return false;
        }
    }
};
exports.AssessmentOwnerGuard = AssessmentOwnerGuard;
exports.AssessmentOwnerGuard = AssessmentOwnerGuard = AssessmentOwnerGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(assessment_session_entity_1.AssessmentSession)),
    __metadata("design:paramtypes", [core_1.Reflector,
        typeorm_2.Repository])
], AssessmentOwnerGuard);
//# sourceMappingURL=assessment-owner.guard.js.map