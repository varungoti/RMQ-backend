import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentSession } from '../entities/assessment_session.entity';

@Injectable()
export class AssessmentOwnerGuard implements CanActivate {
  private readonly logger = new Logger(AssessmentOwnerGuard.name);

  constructor(
    private reflector: Reflector,
    @InjectRepository(AssessmentSession)
    private assessmentSessionRepository: Repository<AssessmentSession>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assumes user is attached by JwtAuthGuard
    const sessionId = request.params.sessionId; // Assumes session ID is in route params

    if (!user || !user.id) {
      this.logger.warn('AssessmentOwnerGuard: User not found on request.');
      return false; // Or throw UnauthorizedException
    }

    if (!sessionId) {
      this.logger.warn('AssessmentOwnerGuard: Session ID not found in request params.');
      return false; // Or throw BadRequestException
    }

    try {
      const session = await this.assessmentSessionRepository.findOne({
        where: { id: sessionId },
        relations: ['user'], // Ensure the user relation is loaded
      });

      if (!session) {
        this.logger.warn(`AssessmentOwnerGuard: Session ${sessionId} not found.`);
        throw new NotFoundException(`Assessment session with ID ${sessionId} not found.`);
      }

      if (session.user.id !== user.id) {
        this.logger.warn(`AssessmentOwnerGuard: User ${user.id} does not own session ${sessionId}. Owner is ${session.user.id}.`);
        throw new ForbiddenException('You do not have permission to access this assessment session.');
      }
      
      this.logger.log(`AssessmentOwnerGuard: User ${user.id} verified as owner of session ${sessionId}.`);
      return true; // User owns the session
    } catch (error) {
        if (error instanceof NotFoundException || error instanceof ForbiddenException) {
            throw error; // Re-throw known exceptions
        }
        this.logger.error(`AssessmentOwnerGuard: Error checking ownership for session ${sessionId}, user ${user.id}: ${error.message}`, error.stack);
        // Decide appropriate action for unexpected errors, e.g., deny access
        return false; 
    }
  }
} 