import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Set up test environment
  console.log('🧪 Setting up E2E test environment...');
  
  // Set test environment variables
  // Note: NODE_ENV is readonly, so we skip setting it here
  process.env['NEXTAUTH_URL'] = process.env['BASE_URL'] || 'http://localhost:3000';
  
  // You can add any global setup here:
  // - Database seeding
  // - Test user creation
  // - External service mocks
  // - Cache clearing
  
  console.log('✅ E2E test environment ready');
}

export default globalSetup;
