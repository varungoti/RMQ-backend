/**
 * Simple NestJS test diagnostic tool
 */
const fs = require('fs');
const path = require('path');

// Get file path from command line args
const filePath = process.argv[2];

if (!filePath) {
  console.error('Please provide a file path to analyze');
  console.error('Usage: node test-diagnostic.js <file-path>');
  process.exit(1);
}

console.log(`Analyzing file: ${filePath}`);

// Read the file
try {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for ES imports
  const nestjsImports = content.match(/import\s+.*from\s+['"](@nestjs\/.*|typeorm)['"]/g) || [];
  if (nestjsImports.length > 0) {
    console.log('\n⚠️ Found ES imports that might cause issues:');
    nestjsImports.forEach(match => {
      console.log(`  - ${match}`);
    });
  } else {
    console.log('\n✅ No problematic ES imports found');
  }
  
  // Check for require statements
  const requireMatches = content.match(/const\s*\{[^}]*\}\s*=\s*require\(['"]@nestjs\/[^'"]+['"]|require\(['"]@nestjs\/[^'"]+['"]\)/g) || [];
  if (requireMatches.length > 0) {
    console.log('\n✅ Using require() for NestJS modules:');
    requireMatches.forEach(match => {
      console.log(`  - ${match.trim()}`);
    });
  }
  
  // Check for hybrid response usage
  const hybridMatches = content.match(/createHybridResponse\(\s*.*,\s*.*,\s*\{.*\}/g) || [];
  if (hybridMatches.length > 0) {
    console.log('\n⚠️ Potentially problematic createHybridResponse usage:');
    hybridMatches.forEach(match => {
      console.log(`  - ${match.trim()}`);
    });
  } else {
    console.log('\n✅ No problematic createHybridResponse calls found');
  }
  
  // Check for type annotations
  if (content.includes(': INestApplication') || 
      content.includes(': Repository<') ||
      content.includes('<Repository<')) {
    console.log('\n⚠️ Found type annotations that might cause issues with require syntax');
  }
  
  console.log('\nAnalysis complete.');
} catch (err) {
  console.error(`Error reading file: ${err.message}`);
  process.exit(1);
} 