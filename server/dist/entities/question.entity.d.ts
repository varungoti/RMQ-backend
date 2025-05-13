import { Skill } from './skill.entity';
import { AssessmentResponse } from './assessment_response.entity';
export declare enum QuestionType {
    MCQ = "MCQ",
    TRUE_FALSE = "TrueFalse",
    SHORT_ANSWER = "ShortAnswer",
    LONG_ANSWER = "LongAnswer",
    MATCH_THE_FOLLOWING = "MatchTheFollowing",
    FILL_IN_THE_BLANK = "FillInTheBlank",
    MULTIPLE_SELECT = "MultipleSelect",
    NUMERICAL = "Numerical",
    GRAPHICAL = "Graphical",
    PROBLEM_SOLVING = "ProblemSolving",
    ESSAY = "Essay"
}
export declare enum QuestionStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    RETIRED = "retired"
}
export declare class Question {
    id: string;
    questionText: string;
    questionType: QuestionType;
    options?: Record<string, unknown>;
    correctAnswer: string;
    difficultyLevel?: number;
    gradeLevel: number;
    status: QuestionStatus;
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    primarySkill: Skill;
    responses: AssessmentResponse[];
}
