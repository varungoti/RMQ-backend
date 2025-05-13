"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.test = void 0;
const response_helper_1 = require("./response-helper");
function runTests() {
    console.log('Testing createHybridResponse function...\n');
    const testCase1 = {
        id: '123',
        userResponse: 'A',
        isCorrect: true,
        answeredAt: new Date(),
        question: { id: '456' }
    };
    console.log('Test Case 1: With isCorrect=true');
    const result1 = (0, response_helper_1.createHybridResponse)(testCase1, 'Success message', true);
    logResult(result1);
    const testCase2 = {
        id: '123',
        userResponse: 'B',
        isCorrect: false,
        answeredAt: new Date(),
        question: { id: '456' }
    };
    console.log('\nTest Case 2: With isCorrect=false');
    const result2 = (0, response_helper_1.createHybridResponse)(testCase2, 'Error message', false);
    logResult(result2);
    console.log('\nTest Case 3: With null data');
    const result3 = (0, response_helper_1.createHybridResponse)(null, 'Null data message', true);
    logResult(result3);
    const testCase4 = {
        id: '123',
        userResponse: 'C',
        isCorrect: true,
        answeredAt: new Date()
    };
    console.log('\nTest Case 4: With object for successOrProps');
    const result4 = (0, response_helper_1.createHybridResponse)(testCase4, 'Custom props message', { customProp: 'test' });
    logResult(result4);
}
function logResult(result) {
    console.log('Result:', JSON.stringify(result, replacer, 2));
    console.log('Has correct property:', result.hasOwnProperty('correct'));
    if (result.hasOwnProperty('correct')) {
        console.log('Correct value:', result.correct);
    }
    console.log('Success value:', result.success);
    console.log('Response properties:');
    Object.keys(result).forEach(key => {
        console.log(`- ${key}: ${typeof result[key]}`);
    });
}
function replacer(key, value) {
    if (key === 'data' && value === this) {
        return '[Circular Reference]';
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    return value;
}
try {
    runTests();
}
catch (error) {
    console.error('Error running tests:', error.message);
    console.error(error.stack);
}
exports.test = { runTests };
//# sourceMappingURL=test-response-helper.js.map