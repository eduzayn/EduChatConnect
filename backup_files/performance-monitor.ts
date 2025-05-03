/**
 * Middleware para Monitoramento de Performance
 * 
 * Este módulo implementa o monitoramento de performance da aplicação,
 * registrando tempos de resposta, uso de memória e outros indicadores
 * de performance críticos para identificar gargalos.
 */

import { Request, Response, NextFunction } from 'express';
import createLogger from '../utils/logger';

const logger = createLogger('performance');

// Métricas de performance global
const performanceMetrics = {
  // Contador de requisições
  requestCount: 0,
  
  // Tempo de resposta
  responseTimeMs: {
    total: 0,
    avg: 0,
    min: Number.MAX_SAFE_INTEGER,
    max: 0,
    // Buckets para histograma (em ms): 10, 50, 100, 250, 500, 1000, 2500, 5000, 10000+
    histogram: [0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  
  // Códigos de status HTTP
  statusCodes: {} as Record<number, number>,
  
  // Rotas mais lentas (top 10)
  slowestRoutes: [] as Array<{
    method: string,
    path: string,
    timeMs: number,
    timestamp: Date
  }>,
  
  // Processos em andamento
  activeRequests: 0,
  
  // Tempo de vida do servidor
  startTime: Date.now(),
  
  // Último uso de memória registrado
  lastMemoryUsage: {
    rss: 0,
    heapTotal: 0,
    heapUsed: 0,
    external: 0,
    timestamp: new Date()
  }
};

/**
 * Atualiza o histograma de tempo de resposta
 */
function updateHistogram(timeMs: number): void {
  const thresholds = [10, 50, 100, 250, 500, 1000, 2500, 5000];
  
  for (let i = 0; i < thresholds.length; i++) {
    if (timeMs <= thresholds[i]) {
      performanceMetrics.responseTimeMs.histogram[i]++;
      return;
    }
  }
  
  // Se chegou aqui, é maior que o último threshold
  performanceMetrics.responseTimeMs.histogram[thresholds.length]++;
}

/**
 * Atualiza a lista de rotas mais lentas
 */
function updateSlowestRoutes(method: string, path: string, timeMs: number): void {
  // Adiciona à lista
  performanceMetrics.slowestRoutes.push({
    method,
    path,
    timeMs,
    timestamp: new Date()
  });
  
  // Ordena por tempo (decrescente)
  performanceMetrics.slowestRoutes.sort((a, b) => b.timeMs - a.timeMs);
  
  // Mantém apenas as 10 mais lentas
  if (performanceMetrics.slowestRoutes.length > 10) {
    performanceMetrics.slowestRoutes.pop();
  }
}

/**
 * Atualiza as estatísticas de uso de memória
 */
function updateMemoryUsage(): void {
  const memoryUsage = process.memoryUsage();
  
  performanceMetrics.lastMemoryUsage = {
    rss: memoryUsage.rss,
    heapTotal: memoryUsage.heapTotal,
    heapUsed: memoryUsage.heapUsed,
    external: memoryUsage.external,
    timestamp: new Date()
  };
}

/**
 * Middleware para monitoramento de performance
 */
export default function performanceMonitorMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime();
  const method = req.method;
  const path = req.path;
  
  // Incrementa contador de requisições ativas
  performanceMetrics.activeRequests++;
  
  // Intercepta o método end para medir tempo de resposta
  const originalEnd = res.end;
  
  // @ts-ignore - Tipos complexos na sobreposição do método end
  res.end = function(chunk?: any, encoding?: BufferEncoding, callback?: () => void) {
    // Calcula o tempo de resposta
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const responseTimeMs = seconds * 1000 + nanoseconds / 1000000;
    
    // Atualiza métricas
    performanceMetrics.requestCount++;
    performanceMetrics.responseTimeMs.total += responseTimeMs;
    performanceMetrics.responseTimeMs.avg = 
      performanceMetrics.responseTimeMs.total / performanceMetrics.requestCount;
    performanceMetrics.responseTimeMs.min = 
      Math.min(performanceMetrics.responseTimeMs.min, responseTimeMs);
    performanceMetrics.responseTimeMs.max = 
      Math.max(performanceMetrics.responseTimeMs.max, responseTimeMs);
    
    // Atualiza histograma
    updateHistogram(responseTimeMs);
    
    // Registra código de status
    const statusCode = res.statusCode;
    performanceMetrics.statusCodes[statusCode] = 
      (performanceMetrics.statusCodes[statusCode] || 0) + 1;
    
    // Verifica se é uma das requisições mais lentas
    if (responseTimeMs > 500) {
      updateSlowestRoutes(method, path, responseTimeMs);
      
      // Log de requisição lenta
      logger.warn(`Requisição lenta: ${method} ${path} (${responseTimeMs.toFixed(2)}ms)`, {
        method,
        path,
        statusCode,
        responseTimeMs,
        query: req.query,
        params: req.params
      });
    }
    
    // Decrementa contador de requisições ativas
    performanceMetrics.activeRequests--;
    
    // Chama o método original
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
  next();
}

/**
 * Inicia o monitoramento periódico de métricas de performance
 */
export function initPerformanceMonitoring(interval = 60000): void {
  // Atualiza uso de memória inicial
  updateMemoryUsage();
  
  // Configuração de monitoramento periódico
  setInterval(() => {
    // Atualiza uso de memória
    updateMemoryUsage();
    
    // Calcula métricas adicionais
    const uptime = Math.floor((Date.now() - performanceMetrics.startTime) / 1000);
    const requestsPerSecond = performanceMetrics.requestCount / uptime;
    
    // Gera log periódico de métricas
    logger.info(`Métricas de performance (uptime: ${uptime}s)`, {
      uptime,
      requestCount: performanceMetrics.requestCount,
      activeRequests: performanceMetrics.activeRequests,
      requestsPerSecond: requestsPerSecond.toFixed(2),
      avgResponseTime: performanceMetrics.responseTimeMs.avg.toFixed(2),
      minResponseTime: performanceMetrics.responseTimeMs.min,
      maxResponseTime: performanceMetrics.responseTimeMs.max,
      memoryUsage: {
        rss: (performanceMetrics.lastMemoryUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
        heapTotal: (performanceMetrics.lastMemoryUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
        heapUsed: (performanceMetrics.lastMemoryUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB'
      },
      statusCodes: performanceMetrics.statusCodes
    });
    
  }, interval);
  
  logger.info('Monitoramento de performance iniciado');
}

export { performanceMetrics };