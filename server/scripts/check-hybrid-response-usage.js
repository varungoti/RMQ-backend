#!/usr/bin/env node

/**
 * Script to detect incorrect usage of createHybridResponse function
 * This checks for instances where an object is passed as the third parameter
 * instead of a boolean value.
 */

const fs = require('fs');
const path = require('path');
const { ESLint } = require('eslint');

// Configure ESLint with our custom rule
async function main() {
  try {
    console.log('Checking for incorrect hybrid response usage...');

    // Create a new ESLint instance
    const eslint = new ESLint({
      useEslintrc: false,
      overrideConfig: {
        plugins: ['custom-rules'],
        rules: {
          'custom-rules/no-incorrect-hybrid-response': 'error'
        },
        parser: '@typescript-eslint/parser',
        parserOptions: {
          ecmaVersion: 2020,
          sourceType: 'module',
        }
      },
      rulePaths: [path.resolve(__dirname, '../src/eslint-rules')],
      extensions: ['.ts'],
    });

    // Define the directories to check
    const srcDir = path.resolve(__dirname, '../src');

    // Get all TypeScript files recursively
    const filesToCheck = getAllFiles(srcDir, ['.ts']);

    // Run the linter
    const results = await eslint.lintFiles(filesToCheck);

    // Filter results for our specific rule
    const hybridResponseErrors = results.filter(result => 
      result.messages.some(msg => 
        msg.ruleId === 'custom-rules/no-incorrect-hybrid-response'
      )
    );

    if (hybridResponseErrors.length > 0) {
      console.error('\n❌ Found incorrect createHybridResponse usage:');
      
      hybridResponseErrors.forEach(result => {
        const errors = result.messages.filter(
          msg => msg.ruleId === 'custom-rules/no-incorrect-hybrid-response'
        );
        
        if (errors.length > 0) {
          console.error(`\nFile: ${result.filePath}`);
          errors.forEach(error => {
            console.error(`  Line ${error.line}, Column ${error.column}: ${error.message}`);
          });
        }
      });
      
      console.error('\nPlease fix these issues before committing.');
      process.exit(1);
    }

    console.log('✅ No incorrect hybrid response usage found.');
    process.exit(0);
  } catch (error) {
    console.error('Error running the check:', error);
    process.exit(1);
  }
}

// Helper function to get all files with specific extensions
function getAllFiles(dir, extensions) {
  let files = [];
  
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      files = files.concat(getAllFiles(filePath, extensions));
    } else if (extensions.some(ext => file.endsWith(ext))) {
      files.push(filePath);
    }
  });
  
  return files;
}

// Run the script
main(); 