import { LocalAuthGuard } from './auth/local-auth.guard'; // Adjusted import path

describe('LocalAuthGuard', () => {
  it('should be defined', () => {
    expect(new LocalAuthGuard()).toBeDefined();
  });
}); 