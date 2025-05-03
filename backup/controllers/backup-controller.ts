import { Request, Response } from 'express';
import backupService from '../utils/backup-service';
import createLogger from '../utils/logger';

const backupLogger = createLogger('backup-controller');

/**
 * Controlador para gerenciar backups do sistema
 */
export default class BackupController {
  /**
   * Obtém a lista de backups disponíveis
   */
  static async getBackups(req: Request, res: Response) {
    try {
      backupLogger.info('Listando backups disponíveis');
      const backups = backupService.getBackups();
      
      res.status(200).json({
        success: true,
        count: backups.length,
        data: backups
      });
    } catch (error) {
      backupLogger.error('Erro ao listar backups', { error });
      
      res.status(500).json({
        success: false,
        error: 'Erro ao obter lista de backups',
        message: error.message
      });
    }
  }

  /**
   * Inicia um backup manual
   */
  static async createBackup(req: Request, res: Response) {
    try {
      const { type = 'full' } = req.body;
      
      // Verifica se o tipo de backup é válido
      if (type !== 'full' && type !== 'incremental') {
        return res.status(400).json({
          success: false,
          error: 'Tipo de backup inválido',
          message: 'O tipo de backup deve ser "full" ou "incremental"'
        });
      }
      
      backupLogger.info(`Iniciando backup manual ${type}`);
      
      // Executa o backup de forma assíncrona
      const backup = await backupService.performManualBackup(type);
      
      if (!backup) {
        return res.status(409).json({
          success: false,
          error: 'Backup em andamento',
          message: 'Um backup já está em execução'
        });
      }
      
      res.status(202).json({
        success: true,
        message: `Backup ${type} iniciado com sucesso`,
        data: backup
      });
    } catch (error) {
      backupLogger.error('Erro ao iniciar backup manual', { error });
      
      res.status(500).json({
        success: false,
        error: 'Erro ao iniciar backup',
        message: error.message
      });
    }
  }

  /**
   * Restaura um backup a partir do ID
   */
  static async restoreBackup(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID do backup não fornecido',
          message: 'É necessário fornecer o ID do backup a ser restaurado'
        });
      }
      
      backupLogger.info(`Iniciando restauração do backup ${id}`);
      
      // Executa a restauração
      const success = await backupService.restoreBackup(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Backup não encontrado',
          message: 'O backup solicitado não foi encontrado ou não pode ser restaurado'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Backup restaurado com sucesso'
      });
    } catch (error) {
      backupLogger.error('Erro ao restaurar backup', { error });
      
      res.status(500).json({
        success: false,
        error: 'Erro ao restaurar backup',
        message: error.message
      });
    }
  }

  /**
   * Verifica o status atual do sistema de backup
   */
  static async getBackupStatus(req: Request, res: Response) {
    try {
      backupLogger.info('Verificando status do sistema de backup');
      
      const backups = backupService.getBackups();
      const { needed, type } = backupService.checkBackupNeeded();
      
      // Obtém o último backup completo e incremental
      const lastFullBackup = backups.find(b => b.type === 'full' && b.status === 'completed');
      const lastIncrementalBackup = backups.find(b => b.type === 'incremental' && b.status === 'completed');
      
      // Backup em andamento
      const runningBackup = backups.find(b => b.status === 'in_progress');
      
      res.status(200).json({
        success: true,
        data: {
          totalBackups: backups.length,
          lastFullBackup,
          lastIncrementalBackup,
          runningBackup,
          backupNeeded: needed,
          suggestedBackupType: type,
        }
      });
    } catch (error) {
      backupLogger.error('Erro ao obter status do backup', { error });
      
      res.status(500).json({
        success: false,
        error: 'Erro ao obter status do backup',
        message: error.message
      });
    }
  }
}