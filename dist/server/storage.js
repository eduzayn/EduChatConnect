/**
 * Interface de armazenamento e implementação em memória
 *
 * Este arquivo define a interface IStorage que todas as implementações
 * de armazenamento devem seguir, bem como fornece uma implementação
 * em memória para desenvolvimento.
 */
// Armazenamento em memória (para desenvolvimento)
export class MemStorage {
    constructor() {
        this.automations = [];
        this.conversations = [];
        this.contacts = [];
        this.channels = [];
        this.messages = [];
    }
    // Implementações de automação
    async getAutomations(type) {
        if (type) {
            return this.automations.filter(a => a.type === type);
        }
        return [...this.automations];
    }
    async getAutomationById(id) {
        return this.automations.find(a => a.id === id) || null;
    }
    async createAutomation(data) {
        const id = this.automations.length > 0
            ? Math.max(...this.automations.map(a => a.id)) + 1
            : 1;
        const newAutomation = {
            id,
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.automations.push(newAutomation);
        return newAutomation;
    }
    async updateAutomation(id, data) {
        const index = this.automations.findIndex(a => a.id === id);
        if (index === -1) {
            throw new Error(`Automação com ID ${id} não encontrada`);
        }
        const updatedAutomation = {
            ...this.automations[index],
            ...data,
            updatedAt: new Date().toISOString()
        };
        this.automations[index] = updatedAutomation;
        return updatedAutomation;
    }
    async deleteAutomation(id) {
        const initialLength = this.automations.length;
        this.automations = this.automations.filter(a => a.id !== id);
        return initialLength > this.automations.length;
    }
    // Implementações de conversa
    async getConversationById(id) {
        return this.conversations.find(c => c.id === id) || null;
    }
    async getConversations(filter) {
        if (!filter) {
            return [...this.conversations];
        }
        return this.conversations.filter(c => {
            for (const key in filter) {
                if (c[key] !== filter[key]) {
                    return false;
                }
            }
            return true;
        });
    }
    // Implementações de contato
    async getContactById(id) {
        return this.contacts.find(c => c.id === id) || null;
    }
    // Implementações de canal
    async getChannelById(id) {
        return this.channels.find(c => c.id === id) || null;
    }
    // Implementações de mensagem
    async getMessagesByConversationId(conversationId) {
        return this.messages.filter(m => m.conversationId === conversationId);
    }
}
// Exporta uma instância padrão do armazenamento em memória
export const memStorage = new MemStorage();
