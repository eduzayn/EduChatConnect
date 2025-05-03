
// Deployment entry point for EduChatConnect
console.log('Starting EduChatConnect server...');

// Use ESM for imports
import('./dist/server/index.js')
  .then(() => {
    console.log('Server successfully started');
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    
    try {
      // Try to use the direct TypeScript file through ts-node fallback
      console.log('Attempting fallback server start...');
      // Use dynamic import for compatibility
      import('./server/index.js')
        .catch((fallbackErr) => {
          console.error('Secondary fallback failed:', fallbackErr);
        });
    } catch (fallbackErr) {
      console.error('Fallback server start failed:', fallbackErr);
    }
  });
