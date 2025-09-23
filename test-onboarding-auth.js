// Test script to verify onboarding API authentication
// Run this with: node test-onboarding-auth.js

const testOnboardingAuth = async () => {
  try {
    console.log('Testing onboarding progress API authentication...\n');
    
    // Test 1: Call without authentication - should fail
    console.log('1. Testing without authentication (should fail):');
    const response1 = await fetch('http://localhost:3000/api/onboarding/progress', {
      method: 'GET',
    });
    const result1 = await response1.json();
    console.log('Response status:', response1.status);
    console.log('Response body:', result1);
    console.log('Expected: 401 Unauthorized\n');
    
    // Test 2: Call with invalid token - should fail  
    console.log('2. Testing with invalid token (should fail):');
    const response2 = await fetch('http://localhost:3000/api/onboarding/progress', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token-here'
      }
    });
    const result2 = await response2.json();
    console.log('Response status:', response2.status);
    console.log('Response body:', result2);
    console.log('Expected: 401 Unauthorized\n');
    
    console.log('✅ Authentication tests completed');
    console.log('If you see 401 errors above, the authentication is working correctly!');
    console.log('The "No session found" log should no longer appear when using valid tokens.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testOnboardingAuth();
