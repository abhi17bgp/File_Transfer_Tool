#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting File Transfer App...\n');

// Start backend server
console.log('📡 Starting backend server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// Wait a bit for backend to start
setTimeout(() => {
  console.log('🎨 Starting frontend development server...');
  const frontend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

}, 2000);

backend.on('error', (err) => {
  console.error('❌ Backend server error:', err);
});

console.log('✅ Servers starting up...');
console.log('📱 Backend will be available at: http://localhost:5000');
console.log('🎨 Frontend will be available at: http://localhost:3000');
console.log('\n💡 Press Ctrl+C to stop both servers');
