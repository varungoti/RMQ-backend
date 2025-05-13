import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Skill } from './entities/skill.entity';
import { AssessmentSession } from './entities/assessment_session.entity';
import { AssessmentResponse } from './entities/assessment_response.entity';
import { AssessmentSkillScore } from './entities/assessment_skill_score.entity';
import { UserPerformanceDto, UserPerformanceQueryDto } from './dto/user-performance.dto';
export declare class AnalyticsService {
    private usersRepository;
    private skillsRepository;
    private sessionsRepository;
    private responsesRepository;
    private scoresRepository;
    private readonly logger;
    constructor(usersRepository: Repository<User>, skillsRepository: Repository<Skill>, sessionsRepository: Repository<AssessmentSession>, responsesRepository: Repository<AssessmentResponse>, scoresRepository: Repository<AssessmentSkillScore>);
    getUserPerformance(requestUserId: string, queryParams: UserPerformanceQueryDto): Promise<UserPerformanceDto>;
    private calculateSkillPerformance;
    getClassPerformance(gradeLevel: number): Promise<{
        gradeLevel: number;
        studentCount: number;
        averageScore: number;
        skillBreakdown: any[];
    }>;
}
