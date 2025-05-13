import { AssessmentSession } from './assessment_session.entity';
import { Question } from './question.entity';
export declare class AssessmentResponse {
    id: string;
    userResponse: string;
    isCorrect: boolean;
    answeredAt: Date;
    responseTimeMs?: number;
    assessmentSession: AssessmentSession;
    question: Question;
}
