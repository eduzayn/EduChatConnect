
// Simple deployment entry point for EduChatConnect
// This file serves as the deployment entry point in Replit

console.log('Starting EduChatConnect server...');

// Import the server module
import('./server/index.js')
  .then(() => {
    console.log('Server successfully started');
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    
    // Fallback to starting via require if ESM import fails
    try {
      console.log('Attempting fallback server start...');
      require('./dist/index.js');
    } catch (fallbackErr) {
      console.error('Fallback server start failed:', fallbackErr);
    }
  });
