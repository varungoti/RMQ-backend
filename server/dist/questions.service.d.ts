import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { Skill } from './entities/skill.entity';
import { CreateQuestionDto } from './dto/question.dto';
import { UpdateQuestionDto } from './dto/question.dto';
export declare class QuestionsService {
    private questionsRepository;
    private skillsRepository;
    private readonly logger;
    constructor(questionsRepository: Repository<Question>, skillsRepository: Repository<Skill>);
    create(createQuestionDto: CreateQuestionDto): Promise<Question>;
    findAll(): Promise<Question[]>;
    findOne(id: string): Promise<Question>;
    update(id: string, updateQuestionDto: UpdateQuestionDto): Promise<Question>;
    remove(id: string): Promise<void>;
}
