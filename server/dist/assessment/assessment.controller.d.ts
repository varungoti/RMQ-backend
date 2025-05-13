import { AssessmentService } from './assessment.service';
import { StartAssessmentDto } from 'src/dto/start-assessment.dto';
import { AssessmentSession } from 'src/entities/assessment_session.entity';
import { SubmitAnswerDto } from 'src/dto/submit-answer.dto';
import { GetNextQuestionResponseDto } from 'src/dto/assessment.dto';
import { SkillScoreDto } from 'src/dto/skill-score.dto';
import { User } from 'src/entities/user.entity';
import { Request } from 'express';
import { ResponseWrapper } from 'src/common/wrappers/response.wrapper';
export declare class AssessmentController {
    private readonly assessmentService;
    private readonly logger;
    constructor(assessmentService: AssessmentService);
    startAssessment(req: Request, startAssessmentDto: StartAssessmentDto): Promise<ResponseWrapper<AssessmentSession>>;
    submitAnswer(submitDto: SubmitAnswerDto, user: User): Promise<any>;
    getNextQuestion(sessionId: string, user: User): Promise<ResponseWrapper<GetNextQuestionResponseDto>>;
    getSessionResult(sessionId: string, user: User): Promise<ResponseWrapper<SkillScoreDto>>;
}
