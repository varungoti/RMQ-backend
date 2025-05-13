import { UserRole } from './entities/user.entity';
import { AnalyticsService } from './analytics.service';
import { UserPerformanceDto, UserPerformanceQueryDto } from './dto/user-performance.dto';
interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        role: UserRole;
    };
}
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getUserPerformance(req: AuthenticatedRequest, queryParams: UserPerformanceQueryDto): Promise<UserPerformanceDto>;
    getSkillPerformance(req: AuthenticatedRequest, skillId: string): Promise<import("./dto/user-performance.dto").SkillPerformanceDto | {
        skillId: string;
        message: string;
    }>;
    getClassPerformance(gradeLevel: number): Promise<{
        gradeLevel: number;
        studentCount: number;
        averageScore: number;
        skillBreakdown: any[];
    }>;
}
export {};
