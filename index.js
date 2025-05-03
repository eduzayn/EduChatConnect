
// Deployment entry point for EduChatConnect
console.log('Starting EduChatConnect server...');

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Environment: ${isProduction ? 'production' : 'development'}`);

// Import path for file checking
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for compiled files
const distServerPath = path.join(__dirname, 'dist', 'server', 'index.js');
const hasCompiledFiles = fs.existsSync(distServerPath);

if (isProduction && hasCompiledFiles) {
  // Use ESM for imports in production with compiled files
  import('./dist/server/index.js')
    .then(() => {
      console.log('Server successfully started from compiled files');
    })
    .catch((err) => {
      console.error('Failed to start server from compiled files:', err);
      fallbackToTsNode();
    });
} else {
  // Use TS-Node in development
  fallbackToTsNode();
}

function fallbackToTsNode() {
  console.log('Attempting to start server using typescript directly...');
  
  try {
    // Use dynamic import for compatibility
    import('child_process').then(({ spawn }) => {
      const tsNodeProcess = spawn('npx', ['tsx', 'server/index.ts'], {
        stdio: 'inherit',
        shell: true
      });
      
      tsNodeProcess.on('error', (error) => {
        console.error('Error starting tsx process:', error);
      });
      
      process.on('SIGINT', () => {
        tsNodeProcess.kill('SIGINT');
        process.exit(0);
      });
    });
  } catch (fallbackErr) {
    console.error('Fallback server start failed:', fallbackErr);
  }
}
