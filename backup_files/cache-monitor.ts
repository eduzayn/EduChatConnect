/**
 * Middleware para monitoramento e controle de cache
 * 
 * Este middleware adiciona rotas para monitorar o uso do cache
 * e fornece endpoints para gerenciamento manual do cache.
 */

import { Express, Request, Response, NextFunction } from 'express';
import cacheService from '../utils/cache-service';
import createLogger from '../utils/logger';

const logger = createLogger('cache-monitor');

/**
 * Configura o middleware de monitoramento de cache
 * @param app Instância do Express
 */
export function setupCacheMonitor(app: Express): void {
  // Rota para obter estatísticas de cache
  app.get('/api/admin/cache/stats', isAdmin, (req, res) => {
    const stats = cacheService.getStats();
    res.json({
      stats,
      hitRate: calculateHitRate(stats.hits, stats.misses)
    });
  });
  
  // Rota para limpar todo o cache
  app.post('/api/admin/cache/flush', isAdmin, (req, res) => {
    cacheService.flush();
    logger.info('Cache foi limpo manualmente', { 
      userId: (req.user as any)?.id, 
      username: (req.user as any)?.username 
    });
    res.json({ success: true, message: 'Cache limpo com sucesso' });
  });
  
  // Rota para limpar um namespace específico
  app.post('/api/admin/cache/namespace/:namespace/clear', isAdmin, (req, res) => {
    const namespace = req.params.namespace;
    
    if (!namespace) {
      return res.status(400).json({ 
        success: false, 
        message: 'É necessário especificar um namespace' 
      });
    }
    
    cacheService.clearNamespace(namespace);
    logger.info(`Namespace ${namespace} foi limpo manualmente`, { 
      userId: (req.user as any)?.id, 
      username: (req.user as any)?.username 
    });
    
    res.json({ 
      success: true, 
      message: `Namespace ${namespace} limpo com sucesso` 
    });
  });
  
  // Middleware de log para registrar tempos de resposta
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Apenas registramos para rotas de API
    if (!req.path.startsWith('/api/')) {
      return next();
    }
    
    const start = Date.now();
    
    // Capturamos o status da resposta
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const duration = Date.now() - start;
      
      // Log apenas para respostas lentas (>500ms)
      if (duration > 500) {
        logger.warn(`Resposta lenta em ${req.method} ${req.path}: ${duration}ms`, {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: duration
        });
      }
      
      return originalEnd.apply(res, args);
    };
    
    next();
  });
  
  logger.info('Middleware de monitoramento de cache configurado');
}

/**
 * Middleware para verificar se o usuário é administrador
 */
function isAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Não autorizado' });
  }
  
  const user = req.user as any;
  
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Permissão negada' });
  }
  
  next();
}

/**
 * Calcula a taxa de acerto (hit rate) do cache
 */
function calculateHitRate(hits: number, misses: number): string {
  const total = hits + misses;
  if (total === 0) return '0.00%';
  
  const rate = (hits / total) * 100;
  return `${rate.toFixed(2)}%`;
}

export default setupCacheMonitor;