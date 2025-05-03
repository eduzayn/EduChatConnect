
// Build script for EduChatConnect deployment
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== EduChatConnect Deployment Build ===');

try {
  // Ensure dist directory exists
  const distDir = path.resolve(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
    console.log('✓ Created dist directory');
  }

  // Compile TypeScript
  console.log('Compiling TypeScript...');
  execSync('npx tsc --project tsconfig.node.json', { stdio: 'inherit' });
  
  // Copy necessary files
  console.log('Copying static files...');
  if (fs.existsSync('public')) {
    if (!fs.existsSync('dist/public')) {
      fs.mkdirSync('dist/public', { recursive: true });
    }
    
    // Copy files from public to dist/public
    const publicFiles = fs.readdirSync('public');
    for (const file of publicFiles) {
      const srcPath = path.join('public', file);
      const destPath = path.join('dist/public', file);
      fs.copyFileSync(srcPath, destPath);
    }
    console.log('✓ Copied public files');
  }

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
