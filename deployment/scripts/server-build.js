
// Deployment build script (ES Modules compatible)
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

  // Instalar TypeScript globalmente para garantir acesso ao binário tsc
  console.log('Instalando TypeScript...');
  execSync('npm install -g typescript', { stdio: 'inherit' });
  
  // Verificar se tsc está acessível
  try {
    execSync('tsc --version', { stdio: 'inherit' });
    console.log('TypeScript está instalado e funcionando');
  } catch (e) {
    console.log('Usando método alternativo para acessar TypeScript...');
    // Instalar localmente também como fallback
    execSync('npm install --save-dev typescript', { stdio: 'inherit' });
  }

  // Compilar TypeScript usando o caminho mais seguro
  console.log('Compilando TypeScript...');
  try {
    // Tentar usar npx com caminho explícito
    execSync('npx tsc --project ./tsconfig.node.json', { stdio: 'inherit' });
  } catch (error) {
    console.log('Tentando método alternativo de compilação...');
    // Método alternativo usando o binário local
    execSync('node ./node_modules/typescript/bin/tsc --project ./tsconfig.node.json', { stdio: 'inherit' });
  }

  // Create a basic HTML file if needed
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

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
    <p>Servidor em execução</p>
  </div>
</body>
</html>`;

    fs.writeFileSync(path.join(publicDir, 'index.html'), htmlContent);
    console.log('✓ Created index.html');
  }

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
