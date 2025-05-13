// Script to fix TypeScript import paths
const fs = require('fs');
const path = require('path');

// Check if glob is installed
let glob;
try {
  glob = require('glob');
} catch (e) {
  console.error('glob package is missing, installing...');
  require('child_process').execSync('pnpm add -D glob', { stdio: 'inherit' });
  glob = require('glob');
}

// Get all TypeScript files
const files = glob.sync('src/**/*.ts');

// Map of incorrect imports to correct ones
const importFixes = {
  // Convert relative path imports to absolute path imports with src prefix
  '../dto/': 'src/dto/',
  '../auth/': 'src/auth/',
  '../entities/': 'src/entities/',
  '../common/': 'src/common/',
  // Natural module dependency
  'natural': '@nlpjs/similarity',
  // OpenTelemetry dependencies
  '@opentelemetry/exporter-prometheus': 'prom-client',
  '@opentelemetry/sdk-metrics': 'prom-client'
};

console.log(`🔍 Scanning ${files.length} files for import fixes...`);

let fixedFiles = 0;
let fixedImports = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  let fileFixedImports = 0;

  // Fix imports
  Object.entries(importFixes).forEach(([incorrectPath, correctPath]) => {
    const importRegex = new RegExp(`from ['"]${incorrectPath}([^'"]+)['"]`, 'g');
    content = content.replace(importRegex, (match, modulePath) => {
      fileFixedImports++;
      return `from '${correctPath}${modulePath}'`;
    });
  });

  // Handle special case for imports from 'src/' when the file is already in that directory
  if (file.includes('/src/assessment/')) {
    // Convert 'src/auth/...' to '@app/auth/...' for files in assessment directory
    const srcImportRegex = /from ['"]src\/([^'"]+)['"]/g;
    content = content.replace(srcImportRegex, (match, modulePath) => {
      fileFixedImports++;
      return `from '@app/${modulePath}'`;
    });
  }

  // If file content changed, write it back
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    fixedFiles++;
    fixedImports += fileFixedImports;
    console.log(`✅ Fixed ${fileFixedImports} imports in ${file}`);
  }
});

console.log(`\n🎉 Fixed ${fixedImports} imports in ${fixedFiles} files.`);
console.log('\n⚠️ Note: You may need to install missing dependencies:');
console.log('pnpm add @nlpjs/similarity@5.0.0-alpha.5 prom-client@14.2.0');
console.log('\n📝 Update tsconfig.json to add path aliases:');
console.log(`
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@app/*": ["src/*"]
    }
  }
}`); 