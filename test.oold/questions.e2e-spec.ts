import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { setupTestApp, loginAndGetToken } from '../server/test/utils/e2e-setup';
import { AuthService } from '../server/src/auth/auth.service';
import { CreateQuestionDto } from '../server/src/questions/dto/create-question.dto'; 