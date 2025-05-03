/**
 * Serviço de logging para a aplicação
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Função que cria um logger para um contexto específico
 * @param context Nome do contexto para o logger (ex: "http", "auth", etc)
 * @returns Objeto logger com métodos para diferentes níveis de log
 */
export default function createLogger(context: string) {
  return {
    debug: (message: string, data?: any) => log('debug', context, message, data),
    info: (message: string, data?: any) => log('info', context, message, data),
    warn: (message: string, data?: any) => log('warn', context, message, data),
    error: (message: string, data?: any) => log('error', context, message, data),
  };
}

/**
 * Função genérica de log
 * @param level Nível do log
 * @param context Contexto do log
 * @param message Mensagem do log
 * @param data Dados adicionais (opcional)
 */
function log(level: LogLevel, context: string, message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    context,
    message,
    ...(data ? { data } : {})
  };

  // Em produção, poderíamos enviar isso para um serviço externo
  // ou para arquivos de log formatados
  
  // Formatação para console
  const levelColors = {
    debug: '\x1b[34m', // azul
    info: '\x1b[32m',  // verde
    warn: '\x1b[33m',  // amarelo
    error: '\x1b[31m', // vermelho
    reset: '\x1b[0m'   // reset
  };

  // Formatação simples para o console
  console.log(
    `${levelColors[level]}[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}${levelColors.reset}`, 
    data ? data : ''
  );
}