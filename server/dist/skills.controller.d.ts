import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { Skill } from './entities/skill.entity';
export declare class SkillsController {
    private readonly skillsService;
    private readonly logger;
    constructor(skillsService: SkillsService);
    create(createSkillDto: CreateSkillDto): Promise<Skill>;
    findAll(): Promise<Skill[]>;
    findOne(id: string): Promise<Skill>;
    update(id: string, updateSkillDto: UpdateSkillDto): Promise<Skill>;
    remove(id: string): Promise<void>;
}
