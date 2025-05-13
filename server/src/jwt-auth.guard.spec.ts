import { JwtAuthGuard } from './auth/jwt-auth.guard'; // Adjusted import path

describe('JwtAuthGuard', () => {
  it('should be defined', () => {
    expect(new JwtAuthGuard()).toBeDefined();
  });
}); 