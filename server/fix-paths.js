/**
 * Script to fix paths by removing the server/server directory if it exists
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting path fix script...');

// Check current directory
const currentDir = process.cwd();
console.log('Current directory:', currentDir);

// Check if we're in the server directory
const isServerDir = currentDir.endsWith('server');
console.log('Is server directory:', isServerDir);

// Check if the problematic server/server directory exists
const nestedServerDir = path.join(currentDir, 'server');
const nestedServerExists = fs.existsSync(nestedServerDir);
console.log('Nested server directory exists:', nestedServerExists);

if (nestedServerExists) {
  console.log('Removing nested server directory...');
  try {
    // List contents before removal
    console.log('Contents of nested server directory:');
    const contents = fs.readdirSync(nestedServerDir);
    console.log(contents);
    
    // Check if it's a directory
    const stats = fs.statSync(nestedServerDir);
    if (stats.isDirectory()) {
      // Use the system command for safety (recursive deletion)
      if (process.platform === 'win32') {
        console.log('Using Windows rd command...');
        execSync(`rd /s /q "${nestedServerDir}"`, { stdio: 'inherit' });
      } else {
        console.log('Using Unix rm command...');
        execSync(`rm -rf "${nestedServerDir}"`, { stdio: 'inherit' });
      }
      console.log('Nested server directory removed successfully');
    } else {
      console.log('Nested server is not a directory, it is a file');
    }
  } catch (error) {
    console.error('Error removing nested server directory:', error);
  }
} else {
  console.log('No nested server directory to remove');
}

console.log('Path fix script completed'); 