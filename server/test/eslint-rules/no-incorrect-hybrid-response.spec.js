/**
 * Tests for the no-incorrect-hybrid-response ESLint rule
 */
const { RuleTester } = require('eslint');
const rule = require('./no-incorrect-hybrid-response');

// Configure RuleTester
const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  }
});

// Run tests
ruleTester.run('no-incorrect-hybrid-response', rule, {
  // Valid examples
  valid: [
    {
      code: `createHybridResponse(result, "message", true);`,
    },
    {
      code: `createHybridResponse(result, "message", result.isCorrect);`,
    },
    {
      code: `createHybridResponse(result, "message", { additionalProp: "value" });`,
    },
    {
      code: `createHybridResponse(result, "message");`,
    },
    {
      code: `someOtherFunction({ correct: true });`,
    }
  ],
  
  // Invalid examples
  invalid: [
    {
      code: `createHybridResponse(result, "message", { correct: true });`,
      errors: [{ messageId: 'incorrectUsage' }],
      output: `createHybridResponse(result, "message", true);`,
    },
    {
      code: `createHybridResponse(result, "message", { correct: result.isCorrect });`,
      errors: [{ messageId: 'incorrectUsage' }],
      output: `createHybridResponse(result, "message", result.isCorrect);`,
    },
    {
      code: `createHybridResponse(result, "message", { 
        correct: true,
        someOtherProp: "value" 
      });`,
      errors: [{ messageId: 'incorrectUsage' }],
    }
  ]
});

console.log('All tests passed!'); 