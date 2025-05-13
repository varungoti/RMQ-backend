#!/usr/bin/env node
/**
 * CI/CD script to verify all createHybridResponse usages are correct
 * 
 * This script runs multiple checks:
 * 1. Static code analysis for { correct: ... } pattern
 * 2. ESLint rule for createHybridResponse usage
 * 3. Test verification of fixed controller code
 * 
 * Exit code 0 indicates all checks passed.
 * Exit code 1 indicates one or more checks failed.
 */

const { spawn } = require('child_process');
const path = require('path');

// Helper to run commands and capture output
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const proc = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        console.error(`Command failed with exit code ${code}`);
        resolve(false);
      }
    });
    
    proc.on('error', (err) => {
      console.error(`Failed to run command: ${err.message}`);
      reject(err);
    });
  });
}

async function main() {
  console.log('=== HYBRID RESPONSE USAGE VERIFICATION ===');
  let allPassed = true;
  
  try {
    // 1. Run pattern-based code scan
    console.log('\n=== Running pattern-based scan ===');
    const scanPassed = await runCommand('node', ['check-hybrid-response-usage.js']);
    allPassed = allPassed && scanPassed;
    
    // 2. Run ESLint check with custom rule
    console.log('\n=== Running ESLint with custom rule ===');
    const lintPassed = await runCommand('npm', ['run', 'lint:hybrid-response']);
    allPassed = allPassed && lintPassed;
    
    // 3. Run verification tests
    console.log('\n=== Running verification tests ===');
    const testPassed = await runCommand('npm', ['run', 'test:verify-hybrid-fix']);
    allPassed = allPassed && testPassed;
    
    // Summary
    console.log('\n=== VERIFICATION SUMMARY ===');
    if (allPassed) {
      console.log('✅ All checks passed! createHybridResponse usage is correct.');
      process.exit(0);
    } else {
      console.error('❌ One or more checks failed. Please fix the issues reported above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running verification:', error);
    process.exit(1);
  }
}

main(); 