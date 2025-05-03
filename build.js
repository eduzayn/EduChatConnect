// Build script for EduChatConnect deployment
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting build process...');

try {
  // Ensure TypeScript is installed
  console.log('Installing TypeScript dependency...');
  execSync('npm install --no-save typescript', { stdio: 'inherit' });
  
  // Create dist directory if it doesn't exist
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }

  // Run TypeScript compilation with path to local tsc
  console.log('Compiling TypeScript...');
  execSync('npx --no-install tsc', { stdio: 'inherit' });

  // Copy necessary files
  console.log('Copying static files...');
  if (fs.existsSync('public')) {
    fs.cpSync('public', 'dist/public', { recursive: true });
  }

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}