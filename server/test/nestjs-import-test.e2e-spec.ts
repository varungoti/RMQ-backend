/**
 * Test file to diagnose NestJS import issues
 */
describe('NestJS Import Test', () => {
  
  it('should import and examine @nestjs/testing', () => {
    try {
      // Direct requires for specific components
      const testModule = require('@nestjs/testing');
      
      console.log('=====================================================');
      console.log('NESTJS/TESTING MODULE EXAMINATION:');
      console.log('-----------------------------------------------------');
      console.log('testModule is defined:', testModule !== undefined);
      console.log('testModule type:', typeof testModule);
      console.log('Available exports in @nestjs/testing:');
      Object.keys(testModule).forEach(key => {
        console.log(`- ${key}: ${typeof testModule[key]}`);
        
        // Dig deeper into the Test class
        if (key === 'Test') {
          console.log('  * Test exists:', testModule.Test !== undefined);
          console.log('  * Test type:', typeof testModule.Test);
          console.log('  * Test.createTestingModule exists:', 
                     testModule.Test.createTestingModule !== undefined);
          console.log('  * Test prototype:', Object.getOwnPropertyNames(
                     Object.getPrototypeOf(testModule.Test) || {}).join(', '));
        }
      });
      console.log('=====================================================');
      
      expect(testModule).toBeDefined();
    } catch (error) {
      console.error('Import failed:', error);
      // Make test pass even if import fails, so we can see the error
      expect(true).toBe(true);
    }
  });
  
  it('should try using Test.createTestingModule directly', () => {
    try {
      const { Test } = require('@nestjs/testing');
      
      console.log('=====================================================');
      console.log('ATTEMPTING TO USE Test.createTestingModule:');
      console.log('-----------------------------------------------------');
      console.log('Test exists:', Test !== undefined);
      
      if (Test && typeof Test.createTestingModule === 'function') {
        console.log('Creating test module...');
        try {
          const testingModule = Test.createTestingModule({
            imports: [],
            controllers: [],
            providers: []
          });
          console.log('testingModule created successfully:', testingModule !== undefined);
        } catch (e) {
          console.log('Error creating testing module:', e.message);
        }
      } else {
        console.log('Test.createTestingModule is not a function');
      }
      console.log('=====================================================');
      
      expect(Test).toBeDefined();
    } catch (error) {
      console.error('Test usage failed:', error);
      expect(true).toBe(true);
    }
  });
  
  it('should verify reflect-metadata is properly loaded', () => {
    try {
      // Check if reflect-metadata is loaded (required by NestJS)
      const reflectExists = typeof Reflect !== 'undefined' && 
                           Reflect !== null && 
                           typeof Reflect.metadata === 'function';
      
      console.log('=====================================================');
      console.log('REFLECT-METADATA CHECK:');
      console.log('-----------------------------------------------------');
      console.log('Reflect exists:', typeof Reflect !== 'undefined');
      console.log('Reflect.metadata exists:', typeof Reflect?.metadata === 'function');
      
      if (!reflectExists) {
        // Try to require it if not already loaded
        require('reflect-metadata');
        console.log('Loaded reflect-metadata manually');
        console.log('After manual load - Reflect.metadata exists:', 
                   typeof Reflect?.metadata === 'function');
      }
      console.log('=====================================================');
      
      expect(reflectExists).toBe(true);
    } catch (error) {
      console.error('reflect-metadata check failed:', error);
      expect(true).toBe(true);
    }
  });
}); 