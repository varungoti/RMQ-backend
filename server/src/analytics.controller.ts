import {
  Controller,
  Get,
  UseGuards,
  Query,
  Param,
  Request,
  ParseUUIDPipe,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { AnalyticsService } from './analytics.service';
import { UserPerformanceDto, UserPerformanceQueryDto } from './dto/user-performance.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: UserRole;
  };
}

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get performance data for the authenticated user or a specific user (admin only)
   */
  @Get('user-performance')
  @ApiOperation({ summary: 'Get user performance analytics' })
  @ApiResponse({ status: 200, description: 'Returns user performance data', type: UserPerformanceDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - accessing other user data without admin privileges' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserPerformance(
    @Request() req: AuthenticatedRequest,
    @Query() queryParams: UserPerformanceQueryDto,
  ): Promise<UserPerformanceDto> {
    // If userId is specified and not the requesting user, verify admin role
    if (queryParams.userId && queryParams.userId !== req.user.userId) {
      // Ensure the requesting user is an admin
      if (req.user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only administrators can access other users\' performance data');
      }
    }

    return this.analyticsService.getUserPerformance(req.user.userId, queryParams);
  }

  /**
   * Get detailed performance for a specific skill
   */
  @Get('skill/:skillId')
  @ApiOperation({ summary: 'Get performance data for a specific skill' })
  @ApiResponse({ status: 200, description: 'Returns skill performance data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  async getSkillPerformance(
    @Request() req: AuthenticatedRequest,
    @Param('skillId', ParseUUIDPipe) skillId: string,
  ) {
    // Create a query that filters by the requested skill
    const queryParams: UserPerformanceQueryDto = { 
      skillId
    };
    
    // Pass to the user performance method which will filter by skill
    const performance = await this.analyticsService.getUserPerformance(req.user.userId, queryParams);
    
    // Return just the skill performance part if it exists
    return performance.skillPerformance.length > 0 
      ? performance.skillPerformance[0] 
      : { skillId, message: 'No performance data available for this skill' };
  }

  /**
   * Admin endpoint to get class-wide performance
   */
  @Get('class/:gradeLevel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get class-wide performance for a grade level (admin/teacher only)' })
  @ApiResponse({ status: 200, description: 'Returns class performance data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin or teacher role' })
  async getClassPerformance(
    @Param('gradeLevel', ParseIntPipe) gradeLevel: number,
  ) {
    return this.analyticsService.getClassPerformance(gradeLevel);
  }
} 