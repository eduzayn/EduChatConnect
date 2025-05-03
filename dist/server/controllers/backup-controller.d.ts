import { Request, Response } from 'express';
/**
 * Controlador para gerenciar backups do sistema
 */
export default class BackupController {
    /**
     * Obtém a lista de backups disponíveis
     */
    static getBackups(req: Request, res: Response): Promise<void>;
    /**
     * Inicia um backup manual
     */
    static createBackup(req: Request, res: Response): Promise<any>;
    /**
     * Restaura um backup a partir do ID
     */
    static restoreBackup(req: Request, res: Response): Promise<any>;
    /**
     * Verifica o status atual do sistema de backup
     */
    static getBackupStatus(req: Request, res: Response): Promise<void>;
}
