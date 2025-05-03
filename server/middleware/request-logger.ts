/**
 * Middleware para Logging de Requisições HTTP
 * 
 * Este módulo fornece logging detalhado de requisições HTTP,
 * incluindo tempos de resposta, códigos de status, headers,
 * e corpos de requisição/resposta quando apropriado.
 */

import { Request, Response, NextFunction } from 'express';
import createLogger from '../utils/logger';

const logger = createLogger('http');

/**
 * Formata informações da requisição para o log
 */
function formatRequestInfo(req: Request) {
  return {
    method: req.method,
    url: req.url,
    params: req.params,
    query: req.query,
    ip: req.ip,
    headers: {
      'user-agent': req.headers['user-agent'],
      'referer': req.headers['referer'],
      'accept': req.headers['accept']
    }
  };
}

/**
 * Formata o header Content-Type removendo charset etc
 */
function getContentType(res: Response): string {
  const contentType = res.getHeader('content-type');
  if (typeof contentType === 'string') {
    return contentType.split(';')[0].trim();
  }
  return 'unknown';
}

/**
 * Verifica se o corpo da requisição deve ser logado
 * Evita logging de senhas, arquivos binários e corpos muito grandes
 */
function shouldLogRequestBody(req: Request): boolean {
  // Não loga corpos de solicitações que possam conter senhas
  if (req.path.includes('login') || req.path.includes('auth') || req.path.includes('password')) {
    return false;
  }
  
  // Verifica o content-type
  const contentType = req.headers['content-type'];
  if (!contentType) return false;
  
  // Loga apenas JSON e formulários
  if (contentType.includes('application/json') || 
      contentType.includes('application/x-www-form-urlencoded')) {
    
    // Verifica tamanho (evita logging de arquivos grandes)
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    return contentLength > 0 && contentLength < 10000; // Limite de 10kB
  }
  
  return false;
}

/**
 * Verifica se o corpo da resposta deve ser logado
 */
function shouldLogResponseBody(req: Request, res: Response, bodySize: number): boolean {
  // Skip em rotas de assets e outros recursos estáticos
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i)) {
    return false;
  }
  
  // Verifica se é JSON
  const contentType = getContentType(res);
  if (contentType === 'application/json') {
    // Limite de tamanho para evitar log excessivo
    return bodySize > 0 && bodySize < 10000; // Limite de 10kB
  }
  
  return false;
}

/**
 * Middleware de logging de requisições HTTP
 */
export default function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  // Registra horário de início
  const startTime = process.hrtime();
  
  // Captura corpo da requisição para logging (se aplicável)
  let requestBody: any = undefined;
  if (shouldLogRequestBody(req) && req.body) {
    try {
      // Cria uma cópia limpa, substituindo campos sensíveis
      requestBody = JSON.parse(JSON.stringify(req.body));
      
      // Limpa campos sensíveis
      ['password', 'senha', 'token', 'secret', 'key', 'authorization'].forEach(field => {
        if (requestBody[field]) {
          requestBody[field] = '[REDACTED]';
        }
      });
    } catch (e) {
      // Se não conseguir serializar, ignora
      requestBody = '[Não serializado]';
    }
  }
  
  // Captura corpo da resposta (interceptando res.send/res.json)
  let responseBody: any = undefined;
  let responseBodySize = 0;
  
  // Intercepta método write para capturar tamanho
  const originalWrite = res.write;
  const originalEnd = res.end;
  
  // @ts-ignore - Necessário para capturar e medir o corpo da resposta
  res.write = function(chunk: any) {
    if (chunk) {
      responseBodySize += chunk.length;
    }
    // @ts-ignore
    return originalWrite.apply(res, arguments);
  };
  
  // Substitui res.json para capturar o corpo JSON
  const originalJson = res.json;
  res.json = function(body: any) {
    responseBody = body;
    return originalJson.call(this, body);
  };
  
  // Finalização da resposta - captura métricas finais
  res.on('finish', () => {
    // Calcula tempo de resposta
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const processingTimeMs = seconds * 1000 + nanoseconds / 1000000;
    
    // Informações básicas da resposta
    const responseInfo = {
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      contentType: getContentType(res),
      contentLength: responseBodySize,
      processingTimeMs
    };
    
    // Determina o nível de log com base no código de status
    const level = res.statusCode >= 500 ? 'error' :
                  res.statusCode >= 400 ? 'warn' : 'info';
    
    // Constrói o log
    const logData: any = {
      request: formatRequestInfo(req)
    };
    
    // Adiciona corpo da requisição se disponível e apropriado
    if (requestBody) {
      logData.request.body = requestBody;
    }
    
    // Adiciona dados da resposta
    logData.response = responseInfo;
    
    // Adiciona corpo da resposta se disponível e apropriado
    if (shouldLogResponseBody(req, res, responseBodySize) && responseBody) {
      // Limita o tamanho para evitar logs excessivos
      const truncatedResponseBody = JSON.stringify(responseBody).substring(0, 1000);
      logData.response.body = truncatedResponseBody.length === 1000 ? 
        truncatedResponseBody + '... [truncado]' : responseBody;
    }
    
    // Registra o log com o nível apropriado
    logger[level](`${req.method} ${req.url} ${res.statusCode} ${processingTimeMs.toFixed(0)}ms`, logData);
  });
  
  next();
}