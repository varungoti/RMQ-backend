import { RmqContext } from '@nestjs/microservices';
import { AssessmentService } from '../assessment.service';
import { ProcessAssessmentResponseDto } from './dto/process-assessment-response.dto';
import { FinishAssessmentSessionDto } from './dto/finish-assessment-session.dto';
import { AssessmentMessageResponseDto, AssessmentSessionResultDto } from './dto/assessment-message-response.dto';
export declare class MessagingController {
    private readonly assessmentService;
    private readonly logger;
    constructor(assessmentService: AssessmentService);
    processAssessmentResponse(data: ProcessAssessmentResponseDto, context: RmqContext): Promise<AssessmentMessageResponseDto>;
    finishAssessmentSession(data: FinishAssessmentSessionDto, context: RmqContext): Promise<AssessmentSessionResultDto | AssessmentMessageResponseDto>;
}
