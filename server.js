/**
 * Servidor Express para a aplicação EduChatConnect
 * 
 * Este arquivo inicia um servidor Express que serve os arquivos estáticos
 * e lida com as requisições API da aplicação.
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para logs de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para processar JSON
app.use(express.json());

// Rota de saúde da API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota para dados de versão
app.get('/api/version', (req, res) => {
  res.json({ 
    version: '1.0.0', 
    name: 'EduChatConnect', 
    environment: process.env.NODE_ENV || 'development' 
  });
});

// Qualquer outra rota redireciona para o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicia o servidor na porta especificada
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor EduChatConnect em execução na porta ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promessa rejeitada não tratada:', reason);
});