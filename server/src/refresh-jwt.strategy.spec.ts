import { Test, TestingModule } from '@nestjs/testing';
import { RefreshJwtStrategy, RefreshJwtPayload } from './auth/refresh-jwt.strategy'; // Keep path relative to src/
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express'; // Import Request type

// Mock ConfigService to provide the refresh secret
const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'JWT_REFRESH_SECRET') {
      return 'test-refresh-secret';
    }
    return null;
  }),
};

// Dummy request object
const mockRequest = {} as Request;

describe('RefreshJwtStrategy', () => {
  let strategy: RefreshJwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshJwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<RefreshJwtStrategy>(RefreshJwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should validate and return the payload if JWT is valid', async () => {
      const mockPayload: RefreshJwtPayload = {
        sub: 'user-refresh-test-uuid',
      };

      // Pass mockRequest as the first argument
      const result = await strategy.validate(mockRequest, mockPayload);

      // Expect the strategy to return the payload.
      expect(result).toEqual(mockPayload);
    });

    it('should correctly pass the payload through', async () => {
      const anotherPayload: RefreshJwtPayload = { sub: 'another-user-id' };
      // Pass mockRequest as the first argument
      const result = await strategy.validate(mockRequest, anotherPayload);
      expect(result).toEqual(anotherPayload);
    });

    // Note on validation handled by Passport-JWT remains the same.
  });
}); 