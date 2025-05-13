"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const response_helper_1 = require("./common/utils/response-helper");
const mockSubmitAnswerResult = {
    id: '12345',
    userResponse: 'A',
    isCorrect: true,
    answeredAt: new Date(),
    assessmentSession: {
        id: '67890',
        userId: 'user-123'
    },
    question: {
        id: 'question-456',
        text: 'What is 2+2?'
    }
};
const mockIncorrectResult = {
    id: '54321',
    userResponse: 'B',
    isCorrect: false,
    answeredAt: new Date(),
    assessmentSession: {
        id: '67890',
        userId: 'user-123'
    },
    question: {
        id: 'question-456',
        text: 'What is 2+2?'
    }
};
function testControllerLogic() {
    console.log('==== Testing Assessment Controller submitAnswer logic ====');
    console.log('\n1. Testing with correct answer (isCorrect = true):');
    const result = mockSubmitAnswerResult;
    const message = result.isCorrect ? 'Answer submitted correctly' : 'Answer submitted but incorrect';
    const response = (0, response_helper_1.createHybridResponse)(result, message, result.isCorrect);
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('Has correct property:', response.hasOwnProperty('correct'));
    console.log('correct value:', response.correct);
    console.log('success value:', response.success);
    console.log('\n2. Testing with incorrect answer (isCorrect = false):');
    const result2 = mockIncorrectResult;
    const message2 = result2.isCorrect ? 'Answer submitted correctly' : 'Answer submitted but incorrect';
    const response2 = (0, response_helper_1.createHybridResponse)(result2, message2, result2.isCorrect);
    console.log('Response:', JSON.stringify(response2, null, 2));
    console.log('Has correct property:', response2.hasOwnProperty('correct'));
    console.log('correct value:', response2.correct);
    console.log('success value:', response2.success);
    console.log('\n==== Test Summary ====');
    console.log('First test (correct answer):');
    console.log(`- Expected: correct=true, got: correct=${response.correct}`);
    console.log(`- Expected: success=true, got: success=${response.success}`);
    console.log('Second test (incorrect answer):');
    console.log(`- Expected: correct=false, got: correct=${response2.correct}`);
    console.log(`- Expected: success=false, got: success=${response2.success}`);
    const test1Passed = response.correct === true && response.success === true;
    const test2Passed = response2.correct === false && response2.success === false;
    if (test1Passed && test2Passed) {
        console.log('\n✅ ALL TESTS PASSED: The createHybridResponse implementation correctly adds the "correct" property');
    }
    else {
        console.log('\n❌ TESTS FAILED: The createHybridResponse implementation is not working as expected');
    }
}
testControllerLogic();
//# sourceMappingURL=test-hybrid-response.js.map