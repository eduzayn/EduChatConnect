/**
 * Script de deploy para o Replit
 * 
 * Este script configura o ambiente para deploy no Replit.
 * Ele cria os arquivos necessários e instrui sobre as configurações manuais.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Obter diretório atual em módulos ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Preparando EduChatConnect para deploy no Replit...');

// Garantir que o arquivo index.js está presente na raiz
if (!fs.existsSync('index.js')) {
  console.error('❌ Arquivo index.js não encontrado na raiz!');
  process.exit(1);
}

// Verificar se o servidor está configurado para ouvir em 0.0.0.0
const serverIndex = fs.readFileSync('server/index.ts', 'utf8');
if (!serverIndex.includes("'0.0.0.0'")) {
  console.warn('⚠️ Aviso: O servidor pode não estar configurado para ouvir em 0.0.0.0');
  console.warn('Isso pode causar problemas de acesso ao servidor quando implantado.');
}

// Tentar criar uma build do servidor
console.log('\nTentando criar uma build para o deploy...');
try {
  // Verificar se o diretório dist existe, se não, criar
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
    console.log('✓ Diretório dist criado');
  }
  
  // Criar arquivo .nojekyll (evita problemas com GitHub Pages se for usado)
  fs.writeFileSync('dist/.nojekyll', '');
  
  // Salvar informações de deploy
  const deployInfo = {
    name: 'EduChatConnect',
    deployDate: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    node: process.version
  };
  
  fs.writeFileSync('dist/deploy-info.json', JSON.stringify(deployInfo, null, 2));
  console.log('✓ Informações de deploy geradas');
  
} catch (error) {
  console.error('❌ Erro durante a preparação do deploy:', error);
}

// Instruções para o usuário
console.log(`
╔════════════════════════════════════════════════════════════════╗
║                CONFIGURAÇÃO DE DEPLOY NO REPLIT                ║
╚════════════════════════════════════════════════════════════════╝

Para completar a configuração do deploy no Replit, siga estes passos:

1️⃣ Configurando o segredo de deploy:
   - No painel do Replit, clique em "Secrets" (ícone 🔒)
   - Adicione um novo segredo com:
     • Key: REPLIT_DEPLOYMENT
     • Value: {"run":"node index.js"}

2️⃣ Verificando o código:
   - Confirme que server/index.ts usa '0.0.0.0' como host
   - Exemplo: app.listen(PORT, '0.0.0.0', () => {...})

3️⃣ Deploy no Replit:
   - Clique no botão "Deploy" no topo da interface
   - Escolha "Deploy from Source"
   - Verifique os logs para confirmar que o deploy foi bem-sucedido

Obs: Se o deploy falhar, verifique:
  • Os logs para mensagens de erro específicas
  • Se o servidor está ouvindo na porta 3000
  • Se o servidor está configurado para usar '0.0.0.0' e não 'localhost'

Problemas comuns:
  • "Missing deployment configuration" - verifique se o segredo foi configurado
  • "Run command not properly configured" - verifique o valor do segredo
  • "Port configuration incomplete" - verifique a configuração do servidor
`);

// Adicionalmente, criar um arquivo .replit-deploy para o Replit detectar
const replitDeployConfig = `
# Este é um arquivo de configuração para o deploy no Replit
# Não modifique este arquivo diretamente

run = "node index.js"
language = "node"

[env]
NODE_ENV = "production"

[nix]
channel = "stable-23_11"

[deployment]
run = ["node", "index.js"]
deploymentTarget = "cloudrun"
ignorePorts = false

[[ports]]
localPort = 3000
externalPort = 80
`;

try {
  fs.writeFileSync('.replit-deploy', replitDeployConfig);
  console.log('✓ Arquivo .replit-deploy criado para referência');
} catch (err) {
  console.warn('⚠️ Não foi possível criar o arquivo .replit-deploy');
}

console.log('\n✅ Preparação para deploy concluída!');
console.log('Siga as instruções acima para configurar o deploy no Replit.');