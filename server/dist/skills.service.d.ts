import { Repository } from 'typeorm';
import { Skill } from './entities/skill.entity';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
export declare class SkillsService {
    private skillsRepository;
    private readonly logger;
    constructor(skillsRepository: Repository<Skill>);
    create(createSkillDto: CreateSkillDto): Promise<Skill>;
    findAll(): Promise<Skill[]>;
    findOne(id: string): Promise<Skill>;
    update(id: string, updateSkillDto: UpdateSkillDto): Promise<Skill>;
    remove(id: string): Promise<void>;
}
