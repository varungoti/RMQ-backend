import { AssessmentService } from './assessment.service';
import { StartAssessmentDto } from 'src/dto/start-assessment.dto';
import { SubmitAnswerDto } from 'src/dto/submit-answer.dto';
import { AssessmentSession } from 'src/entities/assessment_session.entity';
import { User } from 'src/entities/user.entity';
import { GetNextQuestionResponseDto, AssessmentResponseDto } from 'src/dto/assessment.dto';
import { SkillScoreDto } from 'src/dto/skill-score.dto';
import { Request as ExpressRequest } from 'express';
import { ResponseWrapper } from 'src/common/wrappers/response.wrapper';
import { MessagingService } from './messaging/messaging.service';
import { FinishSessionDto } from './dto/finish-session.dto';
export declare class AssessmentController {
    private readonly assessmentService;
    private readonly messagingService;
    private readonly logger;
    constructor(assessmentService: AssessmentService, messagingService: MessagingService);
    startAssessment(req: ExpressRequest, startAssessmentDto: StartAssessmentDto): Promise<ResponseWrapper<AssessmentSession>>;
    submitAnswer(user: User, submitDto: SubmitAnswerDto): Promise<ResponseWrapper<AssessmentResponseDto>>;
    submitAnswerAsync(submitAnswerDto: SubmitAnswerDto, req: any): Promise<any>;
    finishSessionAsync(finishSessionDto: FinishSessionDto, req: any): Promise<any>;
    getNextQuestion(sessionId: string, user: User): Promise<ResponseWrapper<GetNextQuestionResponseDto>>;
    getSessionResult(sessionId: string, user: User): Promise<ResponseWrapper<SkillScoreDto>>;
}
