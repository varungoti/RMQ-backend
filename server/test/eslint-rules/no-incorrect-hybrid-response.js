/**
 * Custom ESLint rule to prevent incorrect usage of createHybridResponse
 * 
 * This rule detects cases where createHybridResponse is called with an object
 * that has a 'correct' property as the third parameter, which should be avoided.
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent incorrect usage of createHybridResponse with { correct: ... } object',
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      incorrectUsage: 'Incorrect usage of createHybridResponse. Pass a boolean directly instead of { correct: boolean }.',
    }
  },
  create(context) {
    return {
      CallExpression(node) {
        // Check if the function being called is createHybridResponse
        if (node.callee.name === 'createHybridResponse') {
          // If it has 3 or more arguments
          if (node.arguments.length >= 3) {
            const thirdArg = node.arguments[2];
            
            // Check if the third argument is an object expression
            if (thirdArg.type === 'ObjectExpression') {
              // Look for a property named 'correct'
              const correctProp = thirdArg.properties.find(prop => 
                prop.key.name === 'correct' || 
                (prop.key.type === 'Literal' && prop.key.value === 'correct')
              );
              
              if (correctProp) {
                // Report the error
                context.report({
                  node: thirdArg,
                  messageId: 'incorrectUsage',
                  fix(fixer) {
                    // Try to extract the value expression from the 'correct' property
                    // and replace the entire object with just that value
                    return fixer.replaceText(thirdArg, context.getSourceCode().getText(correctProp.value));
                  }
                });
              }
            }
          }
        }
      }
    };
  }
}; 