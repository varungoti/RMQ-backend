/**
 * ESLint rule to detect incorrect usage of createHybridResponse function
 * Specifically looks for cases where an object is passed as the third parameter
 * instead of a boolean
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce correct usage of createHybridResponse function',
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      incorrectUsage: 'createHybridResponse third parameter should be a boolean, not an object'
    }
  },
  create(context) {
    return {
      CallExpression(node) {
        // Check if the function being called is named createHybridResponse
        if (
          node.callee.type === 'Identifier' && 
          node.callee.name === 'createHybridResponse' &&
          node.arguments.length >= 3
        ) {
          const thirdArg = node.arguments[2];
          
          // Check if third argument is an object literal or has properties that suggest it's an object
          if (
            thirdArg.type === 'ObjectExpression' || 
            (thirdArg.type === 'Identifier' && 
             context.getScope().variables.some(v => 
               v.name === thirdArg.name && 
               v.defs.some(def => 
                 def.node.init && 
                 (def.node.init.type === 'ObjectExpression' || 
                  def.node.init.type === 'NewExpression')
               )
             ))
          ) {
            context.report({
              node,
              messageId: 'incorrectUsage',
              loc: thirdArg.loc
            });
          }
        }
      }
    };
  }
};