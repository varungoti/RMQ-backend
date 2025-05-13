import { RmqContext } from '@nestjs/microservices';
import { AssessmentService } from '../assessment.service';
export declare class MessagingController {
    private readonly assessmentService;
    private readonly logger;
    constructor(assessmentService: AssessmentService);
    processAssessmentResponse(data: {
        userId: string;
        assessmentSessionId: string;
        questionId: string;
        userResponse: string;
    }, context: RmqContext): Promise<import("../dto/assessment.dto").AssessmentResponseDto | {
        success: boolean;
        message: string;
    }>;
    finishAssessmentSession(data: {
        userId: string;
        assessmentSessionId: string;
    }, context: RmqContext): Promise<{
        success: boolean;
        assessmentSessionId: string;
        score: number;
        level: number;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        assessmentSessionId?: undefined;
        score?: undefined;
        level?: undefined;
    }>;
}
