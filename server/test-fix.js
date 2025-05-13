/**
 * NestJS E2E Test Diagnostic & Fix Tool
 * This script helps diagnose and fix the NestJS testing issues
 * 
 * Usage:
 *   node test-fix.js [command] [file-pattern]
 * 
 * Commands:
 *   diagnose - Analyze test files for import issues
 *   fix-imports - Convert ES imports to require statements
 *   run - Run tests with safe configuration
 *   check-hybrid - Check for incorrect usage of createHybridResponse
 * 
 * Examples:
 *   node test-fix.js diagnose test/**/*.e2e-spec.ts
 *   node test-fix.js fix-imports test/assessment.e2e-spec.ts
 *   node test-fix.js run test/minimal-assessment.e2e-spec.ts
 *   node test-fix.js check-hybrid src/**/*.ts
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const { glob } = require('glob');

// Configuration
const config = {
  serverDir: path.resolve(__dirname),
  tempConfigPath: path.join(__dirname, 'test', 'temp-jest-config.js'),
  problematicImports: [
    '@nestjs/testing',
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/swagger',
    'typeorm',
    'class-transformer',
    'class-validator'
  ],
  hybridResponsePattern: /createHybridResponse\(\s*.*,\s*.*,\s*\{.*\}/g,
  nestRequirePattern: /const\s*\{[^}]*\}\s*=\s*require\(['"]@nestjs\/[^'"]+['"]|require\(['"]@nestjs\/[^'"]+['"]\)/g
};

/**
 * Main function
 */
async function main() {
  // Get command and file pattern from args
  const command = process.argv[2] || 'help';
  const filePattern = process.argv[3] || 'test/**/*.e2e-spec.ts';
  
  console.log(`Running command: ${command} on pattern: ${filePattern}`);
  
  switch (command) {
    case 'diagnose':
      await diagnoseFiles(filePattern);
      break;
    case 'fix-imports':
      await fixImports(filePattern);
      break;
    case 'run':
      await runTestSafely(filePattern);
      break;
    case 'check-hybrid':
      await checkHybridUsage(filePattern);
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

/**
 * Show help text
 */
function showHelp() {
  console.log(`
NestJS E2E Test Diagnostic & Fix Tool

Usage:
  node test-fix.js [command] [file-pattern]

Commands:
  diagnose       - Analyze test files for import issues
  fix-imports    - Convert ES imports to require statements
  run            - Run tests with safe configuration
  check-hybrid   - Check for incorrect usage of createHybridResponse
  help           - Show this help message

Examples:
  node test-fix.js diagnose test/**/*.e2e-spec.ts
  node test-fix.js fix-imports test/assessment.e2e-spec.ts
  node test-fix.js run test/minimal-assessment.e2e-spec.ts
  node test-fix.js check-hybrid src/**/*.ts
  `);
}

/**
 * Diagnose NestJS import issues in test files
 */
async function diagnoseFiles(pattern) {
  console.log(`Diagnosing files matching pattern: ${pattern}`);
  
  const files = await glob(pattern, { cwd: config.serverDir });
  console.log(`Found ${files.length} files matching pattern`);
  
  for (const file of files) {
    const filePath = path.join(config.serverDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`\nAnalyzing file: ${file}`);
    
    // Check for ES imports
    const importMatches = content.match(/import\s+.*from\s+['"](@nestjs\/.*|typeorm)['"]/g) || [];
    if (importMatches.length > 0) {
      console.log('  ⚠️ Found ES imports that might cause issues:');
      importMatches.forEach(match => {
        console.log(`    - ${match}`);
      });
    } else {
      console.log('  ✅ No problematic ES imports found');
    }
    
    // Check for require statements
    const requireMatches = content.match(config.nestRequirePattern) || [];
    if (requireMatches.length > 0) {
      console.log('  ✅ Using require() for NestJS modules:');
      requireMatches.forEach(match => {
        console.log(`    - ${match.trim()}`);
      });
    }
    
    // Check for hybrid response usage
    const hybridMatches = content.match(config.hybridResponsePattern) || [];
    if (hybridMatches.length > 0) {
      console.log('  ⚠️ Potentially problematic createHybridResponse usage:');
      hybridMatches.forEach(match => {
        console.log(`    - ${match.trim()}`);
      });
    }
    
    // Check for type annotations
    if (content.includes(': INestApplication') || 
        content.includes(': Repository<') ||
        content.includes('<Repository<')) {
      console.log('  ⚠️ Found type annotations that might cause issues with require syntax');
    }
  }
  
  console.log('\nDiagnosis complete. See findings above.');
}

/**
 * Fix NestJS imports in test files
 */
async function fixImports(pattern) {
  console.log(`Fixing imports in files matching pattern: ${pattern}`);
  
  const files = await glob(pattern, { cwd: config.serverDir });
  console.log(`Found ${files.length} files matching pattern`);
  
  for (const file of files) {
    const filePath = path.join(config.serverDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`\nProcessing file: ${file}`);
    
    // Add reflect-metadata at the top
    if (!content.includes('require(\'reflect-metadata\')') && 
        !content.includes('import \'reflect-metadata\'')) {
      content = '// Ensure reflect-metadata is loaded first\nrequire(\'reflect-metadata\');\n\n' + content;
      console.log('  ✅ Added reflect-metadata require');
    }
    
    // Find and replace ES module imports for NestJS modules
    let hasChanges = false;
    let requireStatements = [];
    
    for (const module of config.problematicImports) {
      const regex = new RegExp(`import\\s+\\{([^}]*)\\}\\s+from\\s+['"]${module.replace('/', '\\/')}.*['"];?`, 'g');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        hasChanges = true;
        const imports = match[1].split(',').map(i => i.trim());
        const requireStr = `const { ${imports.join(', ')} } = require('${module}');`;
        requireStatements.push(requireStr);
        
        // Replace the import with empty space to preserve line numbers
        content = content.substring(0, match.index) + 
                  ' '.repeat(match[0].length) + 
                  content.substring(match.index + match[0].length);
      }
    }
    
    // Insert all require statements together
    if (requireStatements.length > 0) {
      // Find a good place to insert require statements (after imports and comments at top)
      const insertPos = content.search(/^(?!\/\/|import|require)[^\n]+/m);
      if (insertPos !== -1) {
        content = content.substring(0, insertPos) + 
                 '// Convert imports to require syntax\n' +
                 requireStatements.join('\n') + 
                 '\n\n' + 
                 content.substring(insertPos);
      }
      console.log(`  ✅ Converted ${requireStatements.length} imports to require()`);
    }
    
    // Fix type annotations
    if (content.includes(': INestApplication')) {
      content = content.replace(/: INestApplication/g, ': any // INestApplication');
      console.log('  ✅ Fixed INestApplication type annotation');
      hasChanges = true;
    }
    
    if (content.includes(': Repository<')) {
      content = content.replace(/: Repository<[^>]*>/g, ': any // Repository');
      console.log('  ✅ Fixed Repository type annotations');
      hasChanges = true;
    }
    
    if (content.includes('<Repository<')) {
      content = content.replace(/(<|get)<Repository<[^>]*>>\(/g, '$1(');
      console.log('  ✅ Fixed Repository generic parameters');
      hasChanges = true;
    }
    
    // Create a backup of the original file
    if (hasChanges) {
      const backupPath = filePath + '.bak';
      fs.writeFileSync(backupPath, fs.readFileSync(filePath));
      console.log(`  ✅ Created backup at ${backupPath}`);
      
      // Write the modified content
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Updated file with fixes`);
    } else {
      console.log('  ℹ️ No changes needed for this file');
    }
  }
  
  console.log('\nImport fixes complete.');
}

/**
 * Run tests with a safe Jest configuration
 */
async function runTestSafely(pattern) {
  console.log(`Running tests safely for pattern: ${pattern}`);
  
  // Create a temporary Jest config 
  const tempConfig = `
/**
 * Temporary Jest configuration for E2E tests
 * This config avoids module mocking issues with NestJS
 */
module.exports = {
  moduleFileExtensions: [
    "js",
    "json",
    "ts"
  ],
  rootDir: ".",
  testEnvironment: "node",
  testRegex: ".e2e-spec.ts$",
  transform: {
    "^.+\\.ts$": ["ts-jest", {
      isolatedModules: true
    }]
  },
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/../src/$1",
    "^(entities|dto|auth|common)/(.*)$": "<rootDir>/../src/$1/$2",
    "^\\.\\./(dto|entities|auth|common)/(.*)$": "<rootDir>/../src/$1/$2"
  },
  setupFiles: [
    "<rootDir>/setup-env.ts"
    // setup-jest.js intentionally removed
  ],
  moduleDirectories: [
    "../node_modules",
    "node_modules",
    "../../node_modules"
  ],
  testPathIgnorePatterns: [
    "/node_modules/"
  ],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true
};
`;

  // Write the temporary config file
  fs.writeFileSync(config.tempConfigPath, tempConfig);
  console.log('Created temporary Jest config without module mocking');

  // Build the command to run Jest with the temporary config
  const cmd = 'node';
  const args = [
    './node_modules/jest/bin/jest.js',
    '--config',
    config.tempConfigPath,
    '--runInBand',
    '--verbose',
    pattern
  ];

  // Spawn the Jest process
  console.log(`Running Jest with pattern: ${pattern}`);
  const jest = spawn(cmd, args, { stdio: 'inherit', cwd: config.serverDir });

  // Handle process exit
  await new Promise((resolve) => {
    jest.on('close', (code) => {
      // Clean up temporary config file
      try {
        fs.unlinkSync(config.tempConfigPath);
        console.log('Temporary Jest config removed');
      } catch (err) {
        console.error('Error removing temporary Jest config:', err.message);
      }
      
      console.log(`Jest process exited with code ${code}`);
      resolve();
    });
  });
}

/**
 * Check for incorrect usage of createHybridResponse
 */
async function checkHybridUsage(pattern) {
  console.log(`Checking createHybridResponse usage in files matching pattern: ${pattern}`);
  
  const files = await glob(pattern, { cwd: config.serverDir });
  console.log(`Found ${files.length} files matching pattern`);
  
  let issuesFound = 0;
  
  for (const file of files) {
    const filePath = path.join(config.serverDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for createHybridResponse with object as third param
    const matches = content.match(config.hybridResponsePattern) || [];
    
    if (matches.length > 0) {
      console.log(`\n⚠️ Issues found in ${file}:`);
      
      for (const match of matches) {
        issuesFound++;
        console.log(`  - ${match.trim()}`);
        
        // Get line number
        const lines = content.split('\n');
        let lineCount = 0;
        let matchFound = false;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(match)) {
            console.log(`    Line ${i + 1}: ${lines[i].trim()}`);
            matchFound = true;
            break;
          }
        }
        
        if (!matchFound) {
          console.log('    Line number not found (multi-line match)');
        }
        
        // Suggest fix
        const fixedMatch = match.replace(/\{\s*correct:\s*([^}]+)\s*\}/, '$1');
        console.log(`    Suggested fix: ${fixedMatch}`);
      }
    }
  }
  
  if (issuesFound === 0) {
    console.log('\n✅ No issues found with createHybridResponse usage');
  } else {
    console.log(`\n⚠️ Found ${issuesFound} potential issues with createHybridResponse usage`);
    console.log('   These issues may cause tests to fail when checking for specific properties');
    console.log('   Pass a boolean as the third parameter instead of an object to fix');
  }
}

// Run the main function
main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
}); 