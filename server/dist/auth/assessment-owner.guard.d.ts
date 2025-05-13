import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { AssessmentSession } from 'src/entities/assessment_session.entity';
export declare class AssessmentOwnerGuard implements CanActivate {
    private reflector;
    private assessmentSessionRepository;
    private readonly logger;
    constructor(reflector: Reflector, assessmentSessionRepository: Repository<AssessmentSession>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
