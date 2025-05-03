/**
 * Serviço de cache em memória para a aplicação
 * 
 * Este serviço fornece um mecanismo simples de cache em memória
 * com suporte a namespaces, expiração e monitoramento.
 */

import createLogger from './logger';

const logger = createLogger('cache-service');

interface CacheItem {
  key: string;
  value: any;
  expires: number | null; // Timestamp de expiração ou null para não expirar
  namespace: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  itemCount: number;
  namespaces: Record<string, number>; // Contagem de itens por namespace
}

class CacheService {
  private cache: Map<string, CacheItem> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    itemCount: 0,
    namespaces: {}
  };

  // Intervalo de limpeza de itens expirados (em milissegundos)
  private readonly cleanupInterval = 60 * 1000; // 1 minuto

  constructor() {
    // Configurar limpeza periódica de itens expirados
    setInterval(() => this.cleanup(), this.cleanupInterval);
    logger.info('Serviço de cache inicializado');
  }

  /**
   * Obtém um item do cache
   * @param key Chave do item
   * @returns Valor associado à chave ou undefined se não encontrado
   */
  get<T>(key: string): T | undefined {
    // Verificar se o item existe e não expirou
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return undefined;
    }
    
    // Verificar se o item expirou
    if (item.expires !== null && item.expires < Date.now()) {
      this.stats.misses++;
      this.remove(key);
      return undefined;
    }
    
    // Item encontrado e válido
    this.stats.hits++;
    return item.value as T;
  }

  /**
   * Armazena um item no cache
   * @param key Chave do item
   * @param value Valor a ser armazenado
   * @param ttl Tempo de vida em segundos (opcional)
   * @param namespace Namespace para organização (opcional)
   */
  set<T>(key: string, value: T, ttl: number | null = null, namespace = 'default'): void {
    // Remover item existente se presente
    if (this.cache.has(key)) {
      this.remove(key);
    }
    
    // Calcular timestamp de expiração
    const expires = ttl !== null ? Date.now() + (ttl * 1000) : null;
    
    // Armazenar no cache
    this.cache.set(key, {
      key,
      value,
      expires,
      namespace
    });
    
    // Atualizar estatísticas
    this.stats.itemCount++;
    this.stats.size += this.estimateSize(value);
    this.stats.namespaces[namespace] = (this.stats.namespaces[namespace] || 0) + 1;
    
    logger.debug(`Cache: item "${key}" adicionado (namespace: ${namespace}, ttl: ${ttl}s)`);
  }

  /**
   * Remove um item do cache
   * @param key Chave do item a ser removido
   * @returns true se o item foi removido, false se não existia
   */
  remove(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    // Atualizar estatísticas
    this.stats.itemCount--;
    this.stats.size -= this.estimateSize(item.value);
    this.stats.namespaces[item.namespace]--;
    
    // Se o namespace ficar vazio, remover da contagem
    if (this.stats.namespaces[item.namespace] <= 0) {
      delete this.stats.namespaces[item.namespace];
    }
    
    // Remover do cache
    this.cache.delete(key);
    
    logger.debug(`Cache: item "${key}" removido (namespace: ${item.namespace})`);
    return true;
  }

  /**
   * Verifica se um item existe no cache e não expirou
   * @param key Chave a verificar
   * @returns true se o item existe e é válido
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    // Verificar se expirou
    if (item.expires !== null && item.expires < Date.now()) {
      this.remove(key);
      return false;
    }
    
    return true;
  }

  /**
   * Limpa todos os itens do cache
   */
  flush(): void {
    this.cache.clear();
    
    // Reiniciar estatísticas
    this.stats.itemCount = 0;
    this.stats.size = 0;
    this.stats.namespaces = {};
    
    logger.info('Cache: todos os itens foram limpos');
  }

  /**
   * Limpa todos os itens de um namespace específico
   * @param namespace Nome do namespace
   * @returns Número de itens removidos
   */
  clearNamespace(namespace: string): number {
    let count = 0;
    
    // Identificar todas as chaves no namespace
    const keysToRemove: string[] = [];
    
    this.cache.forEach((item) => {
      if (item.namespace === namespace) {
        keysToRemove.push(item.key);
      }
    });
    
    // Remover cada item
    keysToRemove.forEach(key => {
      if (this.remove(key)) {
        count++;
      }
    });
    
    logger.info(`Cache: namespace "${namespace}" limpo (${count} itens removidos)`);
    return count;
  }

  /**
   * Retorna estatísticas de uso do cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Remove itens expirados do cache
   * @returns Número de itens removidos
   */
  private cleanup(): number {
    const now = Date.now();
    let count = 0;
    
    // Identificar itens expirados
    const keysToRemove: string[] = [];
    
    this.cache.forEach((item) => {
      if (item.expires !== null && item.expires < now) {
        keysToRemove.push(item.key);
      }
    });
    
    // Remover cada item expirado
    keysToRemove.forEach(key => {
      if (this.remove(key)) {
        count++;
      }
    });
    
    if (count > 0) {
      logger.debug(`Cache: limpeza automática removeu ${count} itens expirados`);
    }
    
    return count;
  }

  /**
   * Estima o tamanho em bytes de um valor
   * Esta é uma estimativa simplificada e pode não ser precisa para todos os tipos
   */
  private estimateSize(value: any): number {
    if (value === null || value === undefined) {
      return 0;
    }
    
    const type = typeof value;
    
    if (type === 'boolean') {
      return 4;
    } else if (type === 'number') {
      return 8;
    } else if (type === 'string') {
      return value.length * 2; // Aproximação de 2 bytes por caractere
    } else if (Array.isArray(value)) {
      return value.reduce((acc, item) => acc + this.estimateSize(item), 0);
    } else if (type === 'object') {
      // Para objetos, somamos o tamanho das chaves e valores
      return Object.entries(value).reduce(
        (acc, [key, val]) => acc + key.length * 2 + this.estimateSize(val), 
        0
      );
    }
    
    return 0;
  }
}

// Exporta uma instância única do serviço de cache
export default new CacheService();