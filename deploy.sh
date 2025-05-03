#!/bin/bash

# Script de deploy para EduChatConnect
# Este script prepara o projeto para deploy

echo "Preparando EduChatConnect para deploy..."

# Garantir que todas as dependências estão instaladas
echo "Instalando dependências..."
npm install

# Construir o projeto para produção
echo "Construindo projeto para produção..."
npm run build

# Verificar se a build foi bem-sucedida
if [ $? -ne 0 ]; then
    echo "Erro na build do projeto. Abortando deploy."
    exit 1
fi

# Informações para o usuário configurar o Replit corretamente
echo "
----------------------------------------
CONFIGURAÇÃO DE DEPLOY NO REPLIT
----------------------------------------

Para configurar corretamente o deploy no Replit, siga estas etapas:

1. Acesse as configurações do seu Repl (ícone de engrenagem)
2. Vá para a seção 'Secrets'
3. Adicione a seguinte configuração como segredo:
   - Key: REPLIT_DEPLOYMENT
   - Value: {\"run\":\"node dist/index.js\"}

4. Na interface do Replit, clique no botão 'Deploy' 
   na parte superior da interface

5. Certifique-se de que o host está configurado para '0.0.0.0'
   e a porta está definida como 3000 no código

----------------------------------------
"

# Verificar configuração do host e porta
grep -q "app.listen(PORT, '0.0.0.0'" server/index.ts
if [ $? -eq 0 ]; then
    echo "✓ Configuração de host (0.0.0.0) verificada com sucesso!"
else
    echo "⚠️ Aviso: Servidor pode não estar configurado para ouvir em '0.0.0.0'"
    echo "  Recomendamos atualizar server/index.ts para usar:"
    echo "  app.listen(PORT, '0.0.0.0', () => {...});"
fi

echo "
Projeto preparado para deploy! 
Agora você pode usar o botão 'Deploy' no Replit.
"