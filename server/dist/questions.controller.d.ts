import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/question.dto';
import { UpdateQuestionDto } from './dto/question.dto';
import { Question } from './entities/question.entity';
export declare class QuestionsController {
    private readonly questionsService;
    private readonly logger;
    constructor(questionsService: QuestionsService);
    create(createQuestionDto: CreateQuestionDto): Promise<Question>;
    findAll(): Promise<Question[]>;
    findOne(id: string): Promise<Question>;
    update(id: string, updateQuestionDto: UpdateQuestionDto): Promise<Question>;
    remove(id: string): Promise<void>;
}
