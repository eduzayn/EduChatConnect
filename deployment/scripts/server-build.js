/**
 * Script alternativo para fazer build apenas do servidor
 * Isso contorna problemas de build do frontend com Vite
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Iniciando build alternativa para deploy...');

// Criar diretório dist se não existir
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('✓ Diretório dist criado');
}

try {
  // Build apenas do servidor com esbuild
  console.log('Compilando servidor com esbuild...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', 
    { stdio: 'inherit' });
  
  console.log('✓ Build do servidor concluída com sucesso!');
  
  // Copiar arquivos estáticos necessários
  console.log('Copiando arquivos estáticos...');
  
  // Copiar .env se existir
  if (fs.existsSync(path.join(__dirname, '.env'))) {
    fs.copyFileSync(
      path.join(__dirname, '.env'),
      path.join(distDir, '.env')
    );
    console.log('✓ Arquivo .env copiado');
  }
  
  // Criar arquivo de verificação
  fs.writeFileSync(
    path.join(distDir, 'deploy-info.json'),
    JSON.stringify({
      buildDate: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      serverOnly: true
    }, null, 2)
  );
  
  console.log('\n✅ Build alternativa concluída com sucesso!');
  console.log('Execute com: NODE_ENV=production node dist/index.js');
  
} catch (error) {
  console.error('\n❌ Erro durante a build:', error);
  process.exit(1);
}