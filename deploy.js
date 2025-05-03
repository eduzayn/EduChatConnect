#!/usr/bin/env node

/**
 * Script de deploy simplificado para o Replit
 * Versão mínima que garante o funcionamento no Replit
 */

// Configurações básicas
process.env.NODE_ENV = 'production';
const PORT = process.env.PORT || 3000;

console.log('=== EduChatConnect Minimal Deploy ===');
console.log(`Iniciando servidor na porta ${PORT}...`);

// Inicializar servidor Express básico
const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

// Definir diretório público
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Criar um arquivo index.html mínimo se não existir
if (!fs.existsSync(path.join(publicDir, 'index.html'))) {
  fs.writeFileSync(
    path.join(publicDir, 'index.html'),
    `<!DOCTYPE html>
    <html>
    <head>
      <title>EduChatConnect</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 800px; margin: 0 auto; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>EduChatConnect</h1>
        <p>Servidor iniciado com sucesso no modo de deploy.</p>
        <p>Status: <span id="status">Verificando...</span></p>
      </div>
      <script>
        fetch('/api/health')
          .then(res => res.json())
          .then(data => {
            document.getElementById('status').textContent = data.status;
          })
          .catch(err => {
            document.getElementById('status').textContent = 'Erro ao conectar';
          });
      </script>
    </body>
    </html>`
  );
}

// Middlewares básicos
app.use(express.static(publicDir));
app.use(express.json());

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    time: new Date().toISOString()
  });
});

// Rota para todas as outras requisições (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Iniciar o servidor em 0.0.0.0 (acesso externo)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
});