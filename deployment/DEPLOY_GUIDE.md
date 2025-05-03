# Guia de Deploy do EduChatConnect

Este guia contém instruções detalhadas para configurar corretamente o deploy do EduChatConnect no Replit.

## Problemas Identificados

Baseado nos erros encontrados durante a tentativa de deploy:

1. Missing deployment configuration in .replit file
2. Run command is not properly configured
3. Port configuration in .replit file is incomplete

## Passo a Passo para Configuração

### 1. Preparação do Projeto

Antes de fazer deploy, certifique-se de que:

- O arquivo `server/index.ts` está configurado para ouvir em `0.0.0.0` (não apenas localhost)
- A porta 3000 está sendo utilizada corretamente
- O script de build está funcionando (`npm run build`)

### 2. Configuração Manual do Replit

Como não podemos editar diretamente o arquivo `.replit`, você precisará:

1. **Editar a configuração pelo painel do Replit**:
   - Clique no ícone de configurações (engrenagem)
   - Selecione "Secrets"
   - Adicione um novo segredo:
     - Key: `REPLIT_DEPLOYMENT`
     - Value: `{"run":"node dist/index.js"}`

2. **Configuração do Deploy**:
   - No painel do Replit, clique no botão "Deploy"
   - Escolha a opção "Deploy from Source"
   - Selecione a configuração criada no passo anterior

### 3. Configuração Correta do .replit (Referência)

Se você tiver permissão para editar o arquivo `.replit`, ele deve ter a seguinte configuração:

```
modules = ["nodejs-20"]
entrypoint = "server/index.ts"

hidden = [".config", "package-lock.json", "tsconfig.tsbuildinfo"]

[nix]
channel = "stable-23_11"

[deployment]
run = ["npm", "run", "dev"]
deploymentTarget = "cloudrun"
ignorePorts = false

[[ports]]
localPort = 3000
externalPort = 80
description = "Servidor web da aplicação"
protocol = "http"

[env]
NODE_ENV = "development"

[languages]
[languages.typescript]
pattern = "**/{*.ts,*.tsx}"
[languages.typescript.languageServer]
start = ["typescript-language-server", "--stdio"]

[packager]
language = "nodejs-npm"

[packager.features]
enabledForHosting = true
packageSearch = true
guessImports = true

[gitHubImport]
requiredFiles = [".replit", "replit.nix", "package.json"]
```

### 4. Usando o Script de Deploy

Execute nosso script de deploy para facilitar o processo:

```bash
./deploy.sh
```

Este script:
- Instala todas as dependências
- Executa o build do projeto
- Verifica a configuração do servidor
- Fornece instruções adicionais

### 5. Verificação Pós-Deploy

Após fazer o deploy, verifique:

1. Se o servidor está acessível na URL fornecida pelo Replit
2. Se as APIs estão funcionando corretamente
3. Se a aplicação está carregando corretamente no frontend

## Solução de Problemas Comuns

### Erro: "Missing deployment configuration"

Este erro ocorre quando o Replit não encontra as configurações necessárias para deploy.
- Solução: Adicione a Secret `REPLIT_DEPLOYMENT` conforme descrito acima.

### Erro: "Run command is not properly configured"

O comando para iniciar a aplicação não está definido ou está incorreto.
- Solução: Verifique se o value da Secret `REPLIT_DEPLOYMENT` está definido corretamente.

### Erro: "Port configuration is incomplete"

A configuração de porta está ausente ou incompleta.
- Solução: Certifique-se de que o servidor está configurado para ouvir na porta 3000 e em '0.0.0.0'.

## Verificação do Servidor

Para garantir que o servidor está configurado corretamente, verifique se o `server/index.ts` contém:

```typescript
// Correto
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor em execução na porta ${PORT}`);
});

// Não use isto (apenas para localhost):
const server = app.listen(PORT, () => {
  console.log(`Servidor em execução na porta ${PORT}`);
});
```

## Mais Ajuda

Se você continuar enfrentando problemas, considere:

1. Verificar os logs do Replit para mensagens de erro detalhadas
2. Verificar se todas as variáveis de ambiente necessárias estão configuradas
3. Reconstruir o projeto com `npm run build` antes de fazer deploy novamente