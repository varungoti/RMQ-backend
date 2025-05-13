#!/usr/bin/env node
/**
 * Script to check for incorrect usage of createHybridResponse function
 * 
 * This script scans the codebase for places where createHybridResponse is called
 * with an object containing a 'correct' property as the third parameter, which
 * should be avoided in favor of passing a boolean directly.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

// Pattern to match potential issues
const HYBRID_RESPONSE_PATTERN = /createHybridResponse\(\s*.*?,\s*.*?,\s*\{\s*correct\s*:/g;

// File patterns to search
const FILE_PATTERNS = [
  '.ts',
  '.js',
  '.tsx',
  '.jsx',
];

async function scanDirectory(dir, results = []) {
  const files = await readdir(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);
    
    if (stats.isDirectory() && !file.startsWith('node_modules') && !file.startsWith('.git')) {
      await scanDirectory(filePath, results);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (FILE_PATTERNS.includes(ext)) {
        const matches = await scanFile(filePath);
        if (matches.length > 0) {
          results.push({
            file: filePath,
            matches
          });
        }
      }
    }
  }
  
  return results;
}

async function scanFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    const matches = [];
    
    let match;
    while ((match = HYBRID_RESPONSE_PATTERN.exec(content)) !== null) {
      // Get line number for the match
      const lineNumber = (content.substring(0, match.index).match(/\n/g) || []).length + 1;
      
      // Get the full line
      const lines = content.split('\n');
      const line = lines[lineNumber - 1];
      
      matches.push({
        lineNumber,
        line: line.trim(),
        index: match.index
      });
    }
    
    return matches;
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error.message);
    return [];
  }
}

async function main() {
  console.log('Scanning codebase for incorrect createHybridResponse usage...');
  
  const startDir = process.argv[2] || path.resolve(__dirname, '..');
  console.log(`Starting scan in: ${startDir}`);
  
  try {
    const results = await scanDirectory(startDir);
    
    if (results.length === 0) {
      console.log('\n✅ No issues found! All createHybridResponse calls appear to be correct.');
    } else {
      console.log(`\n⚠️ Found ${results.length} files with potential issues:\n`);
      
      results.forEach(({ file, matches }) => {
        console.log(`${file}:`);
        matches.forEach(({ lineNumber, line }) => {
          console.log(`  Line ${lineNumber}: ${line}`);
        });
        console.log('');
      });
      
      console.log('Recommendation: Update these calls to pass the boolean value directly instead of an object:');
      console.log('  FROM: createHybridResponse(result, message, { correct: result.isCorrect })');
      console.log('  TO:   createHybridResponse(result, message, result.isCorrect)');
      
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during scan:', error);
    process.exit(1);
  }
}

main(); 