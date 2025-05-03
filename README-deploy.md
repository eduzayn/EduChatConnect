# Instruções para Deploy no Replit

Este documento contém as instruções detalhadas para realizar o deploy do EduChatConnect no Replit.

## Pré-requisitos

1. **Segredo REPLIT_DEPLOYMENT**:
   - No painel do Replit, clique em "Secrets" (ícone 🔒)
   - Verifique se existe um segredo com:
     - Key: `REPLIT_DEPLOYMENT`
     - Value: `{"run":"node deploy-replit.js", "deploymentTarget":"cloudrun"}`

2. **Arquivos de configuração**:
   - Verifique se os seguintes arquivos estão presentes na raiz do projeto:
     - `deploy-replit.js` (script especial para deploy)
     - `deploy-package.json` (package.json para deploy)
     - `.deployment-meta.json` (metadados do deploy)
     - `.replit-deploy` (configuração para o deploy)

3. **Configuração do servidor**:
   - Confirme que o servidor está configurado para escutar em `0.0.0.0` (endereço para acesso externo)
   - Confirme que o servidor utiliza a porta `3000`

## Processo de Deploy

1. **Preparação**:
   - Certifique-se de que todos os arquivos importantes estão commitados no repositório
   - Verifique se a aplicação está funcionando localmente

2. **Iniciando o Deploy**:
   - No painel do Replit, clique em "Deploy" no topo da interface
   - Escolha "Deploy from Source"
   - Aguarde o processo de deploy iniciar

3. **Monitoramento**:
   - Acompanhe os logs de deploy para identificar possíveis erros
   - O deploy passa por várias etapas: Provision, Build, Bundle e Promote

4. **Solução de Problemas**:
   - Se encontrar o erro "Missing deployment section in .replit file", verifique se o segredo REPLIT_DEPLOYMENT está configurado corretamente
   - Se encontrar o erro "No deployment configuration found", verifique se os arquivos `.replit-deploy` e `deployment.json` estão presentes
   - Se encontrar o erro "Server needs to be configured for external access", verifique se o servidor está configurado para escutar em `0.0.0.0`

## Verificação do Deploy

Após o deploy ser concluído com sucesso:

1. Clique no link fornecido pelo Replit para acessar a aplicação
2. Verifique se todas as funcionalidades estão operando corretamente
3. Teste o acesso em diferentes dispositivos

## Suporte

Se encontrar problemas durante o deploy, consulte a [documentação oficial do Replit](https://docs.replit.com/hosting/deployments/about-deployments) ou entre em contato com o suporte técnico.