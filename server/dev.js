const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function spawnProcess(command, args, name) {
    console.log(`Starting ${name} with command: ${command} ${args.join(' ')}`);
    
    const proc = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, FORCE_COLOR: true },
        cwd: __dirname // Ensure we're in the correct directory
    });

    proc.on('error', (err) => {
        console.error(`Failed to start ${name}:`, err);
        process.exit(1);
    });

    return proc;
}

function checkDistExists() {
    const distPath = path.join(__dirname, 'dist');
    const mainJsPath = path.join(distPath, 'src', 'main.js');
    
    console.log('Checking if dist/src/main.js exists at:', mainJsPath);
    if (!fs.existsSync(mainJsPath)) {
        console.log('dist/src/main.js does not exist yet');
        return false;
    }
    console.log('dist/src/main.js exists');
    return true;
}

// Clean up any existing processes
process.on('SIGTERM', () => {
    console.log('Received SIGTERM');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT');
    process.exit(0);
});

// Ensure we're in the correct directory
console.log('Current directory:', __dirname);
console.log('Starting initial TypeScript build...');

const initialBuild = spawnProcess('pnpm', ['tsc'], 'Initial TypeScript build');

initialBuild.on('exit', (code) => {
    if (code !== 0) {
        console.error('Initial TypeScript build failed');
        process.exit(code);
    }

    console.log('Initial TypeScript build completed successfully');
    
    if (!checkDistExists()) {
        console.error('dist/src/main.js not found after build');
        process.exit(1);
    }

    console.log('Starting TypeScript compiler in watch mode...');
    const tsc = spawnProcess('pnpm', ['run', 'watch:ts'], 'TypeScript compiler');

    console.log('Waiting 2 seconds before starting nodemon...');
    setTimeout(() => {
        if (!checkDistExists()) {
            console.error('dist/src/main.js still not found before starting nodemon');
            tsc.kill();
            process.exit(1);
        }

        console.log('Starting nodemon...');
        const nodemon = spawnProcess('npx', ['nodemon', '--inspect', '--verbose', 'dist/src/main.js'], 'nodemon');
        
        nodemon.on('exit', (code) => {
            console.log('nodemon exited with code:', code);
            tsc.kill();
            process.exit(code);
        });
    }, 2000);

    // Handle process termination
    process.on('SIGINT', () => {
        console.log('Received SIGINT, shutting down...');
        tsc.kill();
        process.exit();
    });
}); 