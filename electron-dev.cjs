const { spawn } = require('child_process');
const electron = require('electron');
const path = require('path');

// Start our development server
const serverProcess = spawn('npm', ['run', 'dev'], {
  shell: true,
  stdio: 'inherit',
  cwd: process.cwd()
});

console.log('Starting development server...');

// Wait for server to start before launching Electron
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
    serverProcess.kill();
    process.exit(code);
  });

  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
    electronProcess.kill();
    process.exit(code);
  });
}, 10000); // Give server 10 seconds to start up

// Handle termination
process.on('SIGINT', () => {
  serverProcess.kill();
  process.exit(0);
});
