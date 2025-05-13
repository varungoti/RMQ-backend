const fetch = require('node-fetch');

// Test configuration
const API_URL = 'http://localhost:3001'; // Adjust if server runs on different port
const TEST_ENDPOINT = '/assessment/submit';

// Test data (replace with valid data for your environment)
const TEST_DATA = {
  assessmentSessionId: '00000000-0000-0000-0000-000000000000', // Replace with a valid UUID
  questionId: '00000000-0000-0000-0000-000000000000', // Replace with a valid UUID
  userResponse: 'A'
};

// Test auth token (replace with a valid token)
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN'; // Replace with a valid JWT token

// Test function
async function testSubmitEndpoint() {
  console.log('Testing submitAnswer endpoint...');
  console.log(`POST ${API_URL}${TEST_ENDPOINT}`);
  console.log('Request data:', JSON.stringify(TEST_DATA, null, 2));
  
  try {
    // Make the API request
    const response = await fetch(`${API_URL}${TEST_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify(TEST_DATA)
    });
    
    // Get the response data
    const responseData = await response.json();
    
    // Log results
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(responseData, null, 2));
    
    // Check specifically for the 'correct' property
    if (responseData.hasOwnProperty('correct')) {
      console.log('\nSUCCESS: Response contains the "correct" property');
      console.log('correct value:', responseData.correct);
    } else {
      console.log('\nERROR: Response does not contain the "correct" property');
    }
    
    // Check the structure of the response
    console.log('\nResponse structure:');
    Object.keys(responseData).forEach(key => {
      console.log(`- ${key}: ${typeof responseData[key]}`);
    });
    
  } catch (error) {
    console.error('Error testing endpoint:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testSubmitEndpoint(); 