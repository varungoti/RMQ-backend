// Script to install missing dependencies
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// List of dependencies to add with correct versions
const dependencies = {
  '@nlpjs/similarity': '5.0.0-alpha.5', // Latest version available
  'prom-client': '14.2.0', // Stable version
};

// Update package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add dependencies if they don't exist
let hasChanges = false;
Object.entries(dependencies).forEach(([dep, version]) => {
  if (!packageJson.dependencies[dep]) {
    console.log(`Adding ${dep}@${version} to dependencies...`);
    packageJson.dependencies[dep] = version;
    hasChanges = true;
  }
});

// Write back package.json if changed
if (hasChanges) {
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('package.json updated.');
}

// Install dependencies
console.log('Installing missing dependencies...');
try {
  execSync('pnpm install --no-frozen-lockfile', { stdio: 'inherit' });
  console.log('Dependencies installed successfully.');
} catch (error) {
  console.error('Failed to install dependencies:', error.message);
  process.exit(1);
}

// Run the import fix script
console.log('\nRunning import fix script...');
try {
  require('./fix-imports.js');
} catch (error) {
  console.error('Error running import fix script:', error.message);
}

console.log('\n🎉 Setup complete. Try building the project now:');
console.log('pnpm build'); 