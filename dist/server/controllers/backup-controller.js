import { backupService } from '../utils/backup-service';
import { log } from '../utils/logger';
/**
 * Controlador para gerenciar backups do sistema
 */
export default class BackupController {
    /**
     * Obtém a lista de backups disponíveis
     */
    static async getBackups(req, res) {
        try {
            const backups = await backupService.getBackups();
            res.json({ backups });
        }
        catch (error) {
            log(`Erro ao listar backups: ${error}`, 'controller', 'error');
            res.status(500).json({ error: 'Erro ao listar backups', message: String(error) });
        }
    }
    /**
     * Inicia um backup manual
     */
    static async createBackup(req, res) {
        try {
            const { name, metadata } = req.body;
            // Validações básicas
            if (name && typeof name !== 'string') {
                return res.status(400).json({ error: 'Nome do backup deve ser uma string' });
            }
            // Iniciar backup assíncrono
            const backup = await backupService.createBackup(name, metadata);
            res.json({
                message: 'Backup iniciado com sucesso',
                backup
            });
        }
        catch (error) {
            log(`Erro ao criar backup: ${error}`, 'controller', 'error');
            res.status(500).json({ error: 'Erro ao criar backup', message: String(error) });
        }
    }
    /**
     * Restaura um backup a partir do ID
     */
    static async restoreBackup(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: 'ID do backup é obrigatório' });
            }
            // Verificar se o backup existe
            const backups = await backupService.getBackups();
            const backupExists = backups.some((backup) => backup.id === id);
            if (!backupExists) {
                return res.status(404).json({ error: 'Backup não encontrado' });
            }
            // Iniciar restauração
            await backupService.restoreBackup(id);
            res.json({
                message: 'Backup restaurado com sucesso'
            });
        }
        catch (error) {
            log(`Erro ao restaurar backup: ${error}`, 'controller', 'error');
            res.status(500).json({ error: 'Erro ao restaurar backup', message: String(error) });
        }
    }
    /**
     * Verifica o status atual do sistema de backup
     */
    static async getBackupStatus(req, res) {
        try {
            const status = backupService.getStatus();
            res.json({ status });
        }
        catch (error) {
            log(`Erro ao obter status de backup: ${error}`, 'controller', 'error');
            res.status(500).json({ error: 'Erro ao obter status de backup', message: String(error) });
        }
    }
}
