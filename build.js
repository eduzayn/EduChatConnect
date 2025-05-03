
/**
 * Build script for EduChatConnect deployment
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting build process...');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('✓ Created dist directory');
}

try {
  // Compile TypeScript
  console.log('Compiling TypeScript...');
  execSync('npx tsc --project tsconfig.node.json', { stdio: 'inherit' });
  console.log('✓ TypeScript compilation successful');

  // Create public directory if it doesn't exist 
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('✓ Created public directory');
    
    // Create a minimal index.html if it doesn't exist
    if (!fs.existsSync(path.join(publicDir, 'index.html'))) {
      const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EduChatConnect</title>
</head>
<body>
  <div id="root">
    <h1>EduChatConnect</h1>
    <p>Aplicação em carregamento...</p>
  </div>
</body>
</html>`;
      
      fs.writeFileSync(path.join(publicDir, 'index.html'), htmlContent);
      console.log('✓ Created minimal index.html');
    }
  }

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
