/**
 * Script to diagnose NestJS module loading issues
 */
console.log('================================');
console.log('NESTJS MODULE DIAGNOSTIC SCRIPT');
console.log('================================');

// First check if reflect-metadata is loaded
try {
  console.log('\n## Checking reflect-metadata');
  console.log('Reflect exists:', typeof Reflect !== 'undefined');
  
  if (typeof Reflect === 'undefined' || typeof Reflect.metadata !== 'function') {
    console.log('Loading reflect-metadata...');
    require('reflect-metadata');
    console.log('reflect-metadata loaded successfully');
  }
  
  console.log('Reflect.metadata exists:', typeof Reflect.metadata === 'function');
} catch (error) {
  console.error('Error loading reflect-metadata:', error.message);
}

// Try loading @nestjs/common
try {
  console.log('\n## Loading @nestjs/common');
  const common = require('@nestjs/common');
  console.log('@nestjs/common loaded successfully');
  console.log('Available exports (sample):', Object.keys(common).slice(0, 5));
  
  // Check Injectable decorator availability
  if (typeof common.Injectable === 'function') {
    console.log('Injectable decorator exists and is a function');
    
    // Create a test class with Injectable
    class TestService {
      getData() {
        return { message: 'Test data' };
      }
    }
    
    try {
      const decorated = common.Injectable()(TestService);
      console.log('Injectable decoration successful:', decorated !== undefined);
    } catch (e) {
      console.error('Error in Injectable decoration:', e.message);
    }
  }
} catch (error) {
  console.error('Error loading @nestjs/common:', error.message);
}

// Try loading @nestjs/core
try {
  console.log('\n## Loading @nestjs/core');
  const core = require('@nestjs/core');
  console.log('@nestjs/core loaded successfully');
  console.log('Available exports:', Object.keys(core));
  
  // Check NestFactory availability
  if (typeof core.NestFactory === 'function' || typeof core.NestFactory === 'object') {
    console.log('NestFactory exists:', typeof core.NestFactory);
  }
} catch (error) {
  console.error('Error loading @nestjs/core:', error.message);
}

// Try loading @nestjs/testing
try {
  console.log('\n## Loading @nestjs/testing');
  const testing = require('@nestjs/testing');
  console.log('@nestjs/testing loaded successfully');
  console.log('Available exports:', Object.keys(testing));
  
  // Check Test class availability
  if (testing.Test) {
    console.log('Test class exists:', typeof testing.Test);
    console.log('Test is a function:', typeof testing.Test === 'function');
    
    if (typeof testing.Test.createTestingModule === 'function') {
      console.log('Test.createTestingModule is a function');
      
      try {
        const moduleRef = testing.Test.createTestingModule({
          imports: [],
          controllers: [],
          providers: []
        });
        
        console.log('TestingModule created successfully:', moduleRef !== undefined);
      } catch (e) {
        console.error('Error creating TestingModule:', e.message);
      }
    } else {
      console.log('Test.createTestingModule is not a function or does not exist');
      console.log('Test class prototype methods:', 
                 Object.getOwnPropertyNames(Object.getPrototypeOf(testing.Test) || {}));
    }
  } else {
    console.log('Test class not found in @nestjs/testing');
  }
} catch (error) {
  console.error('Error loading @nestjs/testing:', error.message);
}

// Check for TypeORM
try {
  console.log('\n## Loading typeorm');
  const typeorm = require('typeorm');
  console.log('typeorm loaded successfully');
  console.log('Available exports (sample):', Object.keys(typeorm).slice(0, 5));
} catch (error) {
  console.error('Error loading typeorm:', error.message);
}

console.log('\n## Module resolution paths:');
console.log('- Module paths:', module.paths);

console.log('\n================================');
console.log('DIAGNOSTIC COMPLETED');
console.log('================================'); 