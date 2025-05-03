/**
 * Serviço para gerenciamento de backups do sistema
 */

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import createLogger from './logger';

const logger = createLogger('backup-service');

// Tipos de backup
type BackupType = 'full' | 'incremental';

// Status de backup
type BackupStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

// Interface para metadados de backup
interface BackupMetadata {
  id: string;
  timestamp: string;
  type: BackupType;
  size: number;
  status: BackupStatus;
  filename: string;
  description?: string;
}

// Configurações
const BACKUP_DIR = process.env.BACKUP_DIR || path.resolve(process.cwd(), 'backups');
const MAX_BACKUPS = 10;
const BACKUP_DB_COMMAND = process.env.BACKUP_DB_COMMAND || 'pg_dump -U postgres -d educhatconnect';
const RESTORE_DB_COMMAND = process.env.RESTORE_DB_COMMAND || 'psql -U postgres -d educhatconnect';

/**
 * Classe de serviço para gerenciamento de backups
 */
class BackupService {
  private backups: BackupMetadata[] = [];
  private isRunning = false;

  constructor() {
    // Criar diretório de backup se não existir
    this.initializeBackupDir();
    // Carregar metadados de backups existentes
    this.loadBackups();
    logger.info('Serviço de backup inicializado');
  }

  /**
   * Inicializa o diretório de backups
   */
  private async initializeBackupDir() {
    try {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
      logger.info(`Diretório de backups criado: ${BACKUP_DIR}`);
    } catch (error) {
      logger.error('Erro ao criar diretório de backups', { error });
    }
  }

  /**
   * Carrega metadados de backups existentes
   */
  private async loadBackups() {
    try {
      const metadataFile = path.join(BACKUP_DIR, 'metadata.json');
      
      // Verificar se arquivo de metadados existe
      try {
        const data = await fs.readFile(metadataFile, 'utf8');
        this.backups = JSON.parse(data);
        logger.info(`Carregados ${this.backups.length} backups existentes`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          // Arquivo não existe, criar novo
          this.backups = [];
          await this.saveMetadata();
          logger.info('Arquivo de metadados de backup criado');
        } else {
          throw error;
        }
      }
    } catch (error) {
      logger.error('Erro ao carregar metadados de backups', { error });
      this.backups = [];
    }
  }

  /**
   * Salva metadados de backups no arquivo
   */
  private async saveMetadata() {
    try {
      const metadataFile = path.join(BACKUP_DIR, 'metadata.json');
      await fs.writeFile(metadataFile, JSON.stringify(this.backups, null, 2), 'utf8');
      logger.debug('Metadados de backup salvos');
    } catch (error) {
      logger.error('Erro ao salvar metadados de backup', { error });
    }
  }

  /**
   * Retorna lista de backups disponíveis
   */
  getBackups(): BackupMetadata[] {
    return [...this.backups].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Verifica se é necessário executar um backup
   */
  checkBackupNeeded(): { needed: boolean, type: BackupType } {
    const sortedBackups = this.getBackups();
    
    // Se não há backups, precisamos de um completo
    if (sortedBackups.length === 0) {
      return { needed: true, type: 'full' };
    }
    
    const now = new Date();
    const lastFullBackup = sortedBackups.find(b => b.type === 'full' && b.status === 'completed');
    const lastIncrementalBackup = sortedBackups.find(b => b.type === 'incremental' && b.status === 'completed');
    
    // Se não há backup completo, precisamos de um
    if (!lastFullBackup) {
      return { needed: true, type: 'full' };
    }
    
    const lastFullDate = new Date(lastFullBackup.timestamp);
    const daysSinceFullBackup = (now.getTime() - lastFullDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Se o último backup completo tem mais de 7 dias, precisamos de outro
    if (daysSinceFullBackup > 7) {
      return { needed: true, type: 'full' };
    }
    
    // Se não há backup incremental ou o último backup foi há mais de 1 dia
    if (!lastIncrementalBackup) {
      return { needed: true, type: 'incremental' };
    }
    
    const lastIncrementalDate = new Date(lastIncrementalBackup.timestamp);
    const hoursSinceIncremental = (now.getTime() - lastIncrementalDate.getTime()) / (1000 * 60 * 60);
    
    // Se o último backup incremental tem mais de 24 horas
    if (hoursSinceIncremental > 24) {
      return { needed: true, type: 'incremental' };
    }
    
    // Caso contrário, não precisamos de backup
    return { needed: false, type: 'incremental' };
  }

  /**
   * Executa um backup manual
   * @param type Tipo de backup (full ou incremental)
   * @returns Metadados do backup ou null se já estiver em execução
   */
  async performManualBackup(type: BackupType): Promise<BackupMetadata | null> {
    // Verificar se já há um backup em andamento
    if (this.isRunning) {
      logger.warn('Tentativa de iniciar backup enquanto outro já está em execução');
      return null;
    }
    
    try {
      this.isRunning = true;
      
      // Gerar ID e timestamp
      const id = `backup_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const timestamp = new Date().toISOString();
      const filename = `${id}.sql`;
      
      // Criar metadados iniciais
      const backup: BackupMetadata = {
        id,
        timestamp,
        type,
        size: 0,
        status: 'in_progress',
        filename
      };
      
      // Adicionar aos metadados e salvar
      this.backups.push(backup);
      await this.saveMetadata();
      
      // Executar backup em background
      this.executeBackup(backup).catch(error => {
        logger.error(`Erro durante execução do backup ${id}`, { error });
      });
      
      return backup;
    } catch (error) {
      this.isRunning = false;
      logger.error('Erro ao iniciar backup manual', { error });
      throw error;
    }
  }

  /**
   * Executa o processo de backup
   * @param backup Metadados do backup
   */
  private async executeBackup(backup: BackupMetadata): Promise<void> {
    try {
      logger.info(`Iniciando execução do backup ${backup.id} (${backup.type})`);
      
      const backupPath = path.join(BACKUP_DIR, backup.filename);
      
      // Executar comando de backup
      const command = `${BACKUP_DB_COMMAND} > ${backupPath}`;
      execSync(command, { stdio: 'ignore' });
      
      // Obter tamanho do arquivo
      const stats = await fs.stat(backupPath);
      backup.size = stats.size;
      backup.status = 'completed';
      
      logger.info(`Backup ${backup.id} concluído com sucesso (${backup.size} bytes)`);
      
      // Remover backups excedentes
      await this.cleanupOldBackups();
    } catch (error) {
      backup.status = 'failed';
      logger.error(`Falha no backup ${backup.id}`, { error });
    } finally {
      // Atualizar metadados e liberar flag
      await this.saveMetadata();
      this.isRunning = false;
    }
  }

  /**
   * Restaura um backup pelo seu ID
   * @param id ID do backup
   * @returns true se restaurado com sucesso
   */
  async restoreBackup(id: string): Promise<boolean> {
    try {
      // Encontrar backup pelos metadados
      const backup = this.backups.find(b => b.id === id);
      
      if (!backup || backup.status !== 'completed') {
        logger.warn(`Tentativa de restaurar backup inexistente ou incompleto: ${id}`);
        return false;
      }
      
      const backupPath = path.join(BACKUP_DIR, backup.filename);
      
      // Verificar se arquivo existe
      try {
        await fs.access(backupPath);
      } catch (error) {
        logger.error(`Arquivo de backup não encontrado: ${backupPath}`, { error });
        return false;
      }
      
      logger.info(`Iniciando restauração do backup ${id}`);
      
      // Executar comando de restauração
      const command = `${RESTORE_DB_COMMAND} < ${backupPath}`;
      execSync(command, { stdio: 'ignore' });
      
      logger.info(`Backup ${id} restaurado com sucesso`);
      return true;
    } catch (error) {
      logger.error(`Erro ao restaurar backup ${id}`, { error });
      return false;
    }
  }

  /**
   * Remove backups antigos para manter apenas um número máximo
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      // Ordenar backups por data (mais recentes primeiro)
      const sortedBackups = [...this.backups].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Se temos mais que o limite, remover os excedentes
      if (sortedBackups.length > MAX_BACKUPS) {
        const backupsToRemove = sortedBackups.slice(MAX_BACKUPS);
        
        for (const backup of backupsToRemove) {
          try {
            // Remover arquivo
            const backupPath = path.join(BACKUP_DIR, backup.filename);
            await fs.unlink(backupPath);
            
            // Remover dos metadados
            this.backups = this.backups.filter(b => b.id !== backup.id);
            
            logger.info(`Backup antigo removido: ${backup.id}`);
          } catch (error) {
            logger.error(`Erro ao remover backup antigo ${backup.id}`, { error });
          }
        }
        
        // Salvar metadados atualizados
        await this.saveMetadata();
      }
    } catch (error) {
      logger.error('Erro ao limpar backups antigos', { error });
    }
  }
}

// Exportar instância única do serviço
export default new BackupService();