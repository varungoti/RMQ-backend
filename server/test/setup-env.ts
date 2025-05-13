/**
 * E2E Test Environment Setup
 * Loads environment variables safely for testing
 */

// Instead of importing dotenv directly, we manually set environment variables
// This avoids the package.json resolution issues

// Directly set the critical environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_HOST = 'localhost';
process.env.DATABASE_PORT = '5432';
process.env.DATABASE_USERNAME = 'test_user';
process.env.DATABASE_PASSWORD = 'test_password';
process.env.DATABASE_NAME = 'test_db';
process.env.DATABASE_URL = 'postgresql://test_user:test_password@localhost:5432/test_db';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret';
process.env.JWT_EXPIRATION_TIME = '3600';
process.env.ENABLE_SWAGGER = 'true';
process.env.PORT = '3001';
process.env.CORS_ORIGIN = 'http://localhost:3000';

console.log('E2E Test Environment Setup: Environment variables configured directly.'); 