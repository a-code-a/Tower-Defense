const { spawn } = require('child_process');
const electron = require('electron');
const path = require('path');

// Start Vite dev server
const viteProcess = spawn('npx', ['vite', '--config', 'vite.config.ts', '--host'], {
  shell: true,
  stdio: 'inherit',
  cwd: process.cwd()
});

console.log('Starting Vite development server...');

// Wait for Vite to start before launching Electron
setTimeout(() => {
  console.log('Starting Electron...');
  
  // Start Electron
  const electronProcess = spawn(electron, ['.'], {
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });

  // Handle process exit
  electronProcess.on('close', (code) => {
    console.log(`Electron process exited with code ${code}`);
    viteProcess.kill();
    process.exit(code);
  });

  viteProcess.on('close', (code) => {
    console.log(`Vite process exited with code ${code}`);
    electronProcess.kill();
    process.exit(code);
  });
}, 5000); // Give Vite 5 seconds to start up

// Handle termination
process.on('SIGINT', () => {
  viteProcess.kill();
  process.exit(0);
});
