/**
 * Script de deploy específico para o Replit
 * 
 * Este script configura o ambiente para garantir o deploy no Replit Cloud.
 * Ele inicializa o servidor com as configurações corretas para acesso externo.
 */

// Forçar o ambiente de produção
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '3000';

console.log('=== EduChatConnect Deploy Script ===');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${process.env.PORT}`);
console.log('Preparando para deploy no Replit Cloud...');

// Importações padrão
const express = require('express');
const path = require('path');
const fs = require('fs');

// Cria o app Express
const app = express();
const PORT = parseInt(process.env.PORT, 10);

// Configura como produção
app.set('env', 'production');

// Diretório base da aplicação
const rootDir = path.resolve(__dirname);
const publicDir = path.join(rootDir, 'public');

// Middleware para logs básicos
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Garantir que a pasta public existe
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('✓ Pasta public criada');
}

// Criar um arquivo index.html básico se não existir
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
    <p>Inicializando a aplicação em modo de produção...</p>
  </div>
  <script>
    // Verificar status do servidor
    fetch('/api/status')
      .then(response => response.json())
      .then(data => {
        document.getElementById('root').innerHTML = '<h1>EduChatConnect</h1><p>Status: ' + data.status + '</p>';
      })
      .catch(err => {
        console.error('Erro ao verificar status:', err);
      });
  </script>
</body>
</html>`;
    
  fs.writeFileSync(path.join(publicDir, 'index.html'), htmlContent);
  console.log('✓ Arquivo index.html de fallback criado');
}

// Configurar middlewares padrões
app.use(express.static(publicDir));
app.use(express.json());

// Rota de status/healthcheck
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Rota de fallback para o SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Iniciar o servidor explicitamente em 0.0.0.0 para acesso externo
app.listen(PORT, '0.0.0.0', () => {
  console.log('==============================================');
  console.log(`✅ Servidor iniciado em http://0.0.0.0:${PORT}`);
  console.log('==============================================');
  
  // Informações de diagnóstico
  console.log('Informações do ambiente:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- Diretório base:', rootDir);
  console.log('- Diretório public:', publicDir);
  console.log('- Public existe:', fs.existsSync(publicDir) ? 'Sim' : 'Não');
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('ERRO NÃO CAPTURADO:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('PROMESSA REJEITADA NÃO TRATADA:', reason);
});