// Import node-fetch for older Node.js versions
const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:3001';
const API_ENDPOINT = '/assessment/submit';

// Sample JWT token for a student user (replace with a valid token)
const JWT_TOKEN = 'YOUR_JWT_TOKEN';

// Sample submission data
const submitData = {
  assessmentSessionId: '123e4567-e89b-12d3-a456-426614174000', // Replace with a valid session ID
  questionId: '123e4567-e89b-12d3-a456-426614174001',         // Replace with a valid question ID
  userResponse: 'A'                                           // Replace with a valid response
};

async function testSubmitAnswer() {
  try {
    console.log('Testing submitAnswer endpoint...');
    console.log('Request data:', submitData);
    
    const response = await fetch(`${BASE_URL}${API_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
      },
      body: JSON.stringify(submitData)
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(data, null, 2));
    
    // Check hybrid response structure
    console.log('\nHybrid Response Analysis:');
    console.log('- success property:', data.success);
    console.log('- message property:', data.message);
    console.log('- data property present:', 'data' in data);
    console.log('- isCorrect property:', data.isCorrect);
    console.log('- correct property (backward compatibility):', data.correct);
    
    // Validate that correct and isCorrect are the same (backward compatibility)
    if (data.isCorrect === data.correct) {
      console.log('\n✅ PASS: isCorrect and correct properties match');
    } else {
      console.log('\n❌ FAIL: isCorrect and correct properties do not match');
    }
    
    // Validate that success is a boolean and not related to isCorrect
    if (typeof data.success === 'boolean') {
      console.log('✅ PASS: success is a boolean value');
    } else {
      console.log('❌ FAIL: success is not a boolean value');
    }
    
  } catch (error) {
    console.error('Error testing submitAnswer endpoint:', error);
  }
}

// Run the test
testSubmitAnswer(); 