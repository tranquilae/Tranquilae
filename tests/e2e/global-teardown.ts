async function globalTeardown() {
  // Clean up after all tests
  console.log('🧹 Cleaning up E2E test environment...');
  
  // You can add any global cleanup here:
  // - Database cleanup
  // - Test user deletion
  // - Cache clearing
  // - External service cleanup
  
  console.log('✅ E2E test environment cleaned up');
}

export default globalTeardown;
