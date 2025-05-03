
// Arquivo index.js atualizado para suportar ES modules
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verificar ambiente
const isProduction = process.env.NODE_ENV === 'production';
console.log('Starting EduChatConnect server...');
console.log(`Environment: ${isProduction ? 'production' : 'development'}`);

// Caminhos para verificar
const distServerPath = path.join(__dirname, 'dist', 'server', 'index.js');

// Função principal para iniciar o servidor
const startServer = async () => {
  try {
    // Primeiro método: tentar usar o código compilado em produção
    if (isProduction && fs.existsSync(distServerPath)) {
      console.log('Starting server from compiled files...');
      
      // Carregar o servidor compilado via ES modules
      const { default: startCompiledServer } = await import(distServerPath);
      if (typeof startCompiledServer === 'function') {
        startCompiledServer();
        return;
      }
    }
    
    // Segundo método: tentar usar TypeScript diretamente (desenvolvimento ou fallback)
    console.log('Attempting to start server using typescript directly...');
    
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
  } catch (fallbackErr) {
    console.error('Server start failed:', fallbackErr);
    process.exit(1);
  }
};

// Iniciar o servidor
startServer();
