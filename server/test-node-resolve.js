// Simple script to test NestJS module resolution
try {
  console.log('Testing module resolution...');
  
  // Try to load @nestjs/testing
  const nestjsTesting = require('@nestjs/testing');
  console.log('Successfully loaded @nestjs/testing:');
  console.log('- Module keys:', Object.keys(nestjsTesting));
  
  // Try to load @nestjs/common
  const nestjsCommon = require('@nestjs/common');
  console.log('Successfully loaded @nestjs/common:');
  console.log('- Module keys:', Object.keys(nestjsCommon));
  
  // Try to load the Test class
  console.log('Test class from @nestjs/testing:', nestjsTesting.Test);
  
  if (nestjsTesting.Test) {
    console.log('Test class exists and is available');
  } else {
    console.log('Test class is undefined or null');
  }
  
  console.log('Module resolution test completed successfully.');
} catch (error) {
  console.error('Error during module resolution test:');
  console.error(error);
} 