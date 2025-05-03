import { pgTable, text, serial, integer, timestamp, boolean, jsonb, date, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table for authentication and user management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").default("agent").notNull(), // "admin" ou "agent"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  messages: many(messages),
}));

// Contacts table for CRM functionality
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  identifier: text("identifier").notNull(), // Social/channel identifier
  source: text("source").notNull(), // e.g., "whatsapp", "instagram", "messenger"
  company: text("company"),
  position: text("position"),
  notes: text("notes"),
  externalId: text("external_id"), // ID in external systems
  // CRM fields
  status: text("status").default("novo").notNull(), // novo, qualificado, cliente, arquivado
  leadStage: text("lead_stage").default("inicial"), // inicial, oportunidade, proposta, negociação
  leadScore: integer("lead_score").default(0), // 0-100 score
  tags: text("tags").array(), // Tags for categorization
  lastContactDate: timestamp("last_contact_date"), // Last meaningful interaction date
  customFields: jsonb("custom_fields"), // Flexible schema for custom fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Contact relations (declarado antes para evitar erros de referência)
export const contactsRelations = relations(contacts, ({ many }) => ({
  conversations: many(conversations),
}));

// Channels table for integration settings
export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // e.g., "whatsapp_twilio", "whatsapp_zap", "messenger", "instagram"
  config: text("config").notNull(), // JSON configuration
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Channel relations
export const channelsRelations = relations(channels, ({ many }) => ({
  conversations: many(conversations),
}));

// Conversations table to group messages
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  channelId: integer("channel_id").notNull().references(() => channels.id),
  assignedTo: integer("assigned_to").references(() => users.id),
  status: text("status").notNull(), // e.g., "open", "closed", "pending"
  lastMessageId: integer("last_message_id"), // Most recent message ID
  contactIdentifier: text("contact_identifier").notNull(), // e.g., phone number or social media ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Conversation relations
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [conversations.contactId],
    references: [contacts.id],
  }),
  channel: one(channels, {
    fields: [conversations.channelId],
    references: [channels.id],
  }),
  assignedUser: one(users, {
    fields: [conversations.assignedTo],
    references: [users.id],
  }),
  messages: many(messages),
}));

// Messages table for actual content
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  content: text("content").notNull(),
  contentType: text("content_type").notNull().default("text"), // e.g., "text", "image", "audio"
  direction: text("direction").notNull(), // "inbound" or "outbound"
  status: text("status").notNull(), // e.g., "sent", "delivered", "read"
  sentById: integer("sent_by_id").references(() => users.id),
  externalId: text("external_id"), // ID from external source
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Deal (Opportunity) table
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  title: text("title").notNull(),
  value: integer("value"), // Value in cents
  currency: text("currency").default("BRL"),
  stage: text("stage").notNull().default("qualificacao"), // funil: qualificacao, proposta, negociacao, fechado_ganho, fechado_perdido
  status: text("status").default("open").notNull(), // open, won, lost
  probability: integer("probability").default(50), // 0-100% de chance de fechamento
  expectedCloseDate: date("expected_close_date"),
  description: text("description"),
  assignedTo: integer("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").references(() => contacts.id), // Removido notNull para permitir atividades vinculadas apenas a negociações
  userId: integer("user_id").references(() => users.id),
  dealId: integer("deal_id").references(() => deals.id),
  type: text("type").notNull(), // call, email, meeting, task, note
  subject: text("subject").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false),
  status: text("status").default("pending").notNull(), // pending, completed, canceled
  completedAt: timestamp("completed_at"), // When the activity was completed
  result: text("result"), // outcome of the activity
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Message relations
export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sentBy: one(users, {
    fields: [messages.sentById],
    references: [users.id],
  }),
}));

// Deal relations
export const dealsRelations = relations(deals, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [deals.contactId],
    references: [contacts.id],
  }),
  assignedUser: one(users, {
    fields: [deals.assignedTo],
    references: [users.id],
  }),
  activities: many(activities),
}));

// Activity relations
export const activitiesRelations = relations(activities, ({ one }) => ({
  contact: one(contacts, {
    fields: [activities.contactId],
    references: [contacts.id],
  }),
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
  deal: one(deals, {
    fields: [activities.dealId],
    references: [deals.id],
  }),
}));

// Tabela de regras de roteamento de conversas
export const routingRules = pgTable("routing_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Nome descritivo da regra
  description: text("description"), // Descrição da regra
  channelId: integer("channel_id").references(() => channels.id), // Opcional, se a regra for específica para um canal
  condition: jsonb("condition").notNull(), // Condições para a regra ser aplicada (formato JSON)
  action: jsonb("action").notNull(), // Ação a ser executada quando a regra for acionada
  priority: integer("priority").notNull().default(10), // Prioridade da regra (menor número = maior prioridade)
  isActive: boolean("is_active").notNull().default(true), // Se a regra está ativa ou não
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Índice composto por prioridade e se está ativo para ordenação rápida
    priorityIndex: index("routing_rules_priority_idx").on(table.priority),
    activeIndex: index("routing_rules_is_active_idx").on(table.isActive)
  };
});

// Tabela de histórico de aplicação de regras de roteamento
export const routingHistory = pgTable("routing_history", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  ruleId: integer("rule_id").references(() => routingRules.id), // Pode ser null se foi roteamento manual
  assignedTo: integer("assigned_to").references(() => users.id),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  details: jsonb("details"), // Detalhes adicionais sobre o roteamento
  isAutomatic: boolean("is_automatic").notNull().default(true), // Se foi aplicado automaticamente ou manualmente
});

// Tabela para fila de processamento de webhooks
export const webhookQueue = pgTable("webhook_queue", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(), // Nome do provedor do webhook: 'twilio', 'meta', 'zapapi', 'sendgrid', etc.
  channelId: integer("channel_id").references(() => channels.id),
  payload: jsonb("payload").notNull(), // Corpo completo do webhook como JSON
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'completed', 'failed'
  attempts: integer("attempts").notNull().default(0), // Número de tentativas de processamento
  lastError: text("last_error"), // Último erro encontrado, se houver
  processAfter: timestamp("process_after").defaultNow(), // Permite escalonamento de retentativas
  priority: integer("priority").notNull().default(5), // Prioridade do webhook (1-10, menor número = maior prioridade)
  tags: text("tags").array(), // Tags para categorização e filtragem
  processingTimeMs: integer("processing_time_ms"), // Tempo de processamento em ms (para análise de performance)
  batchId: text("batch_id"), // Identificador para agrupar webhooks relacionados
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"), // Quando o processamento foi concluído com sucesso
});

// Tabela para automações e respostas rápidas
export const automations = pgTable("automations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Nome da automação ou resposta rápida
  description: text("description"), // Descrição da finalidade da automação
  type: text("type").notNull(), // 'chatbot', 'quick_reply', 'scheduled', 'trigger'
  channelId: integer("channel_id").references(() => channels.id), // Opcional, se específico para um canal
  isActive: boolean("is_active").notNull().default(true),
  priority: integer("priority").notNull().default(10), // Prioridade de execução
  trigger: jsonb("trigger"), // Condições que ativam a automação (padrões, palavras-chave, horários)
  response: jsonb("response").notNull(), // Conteúdo da resposta ou ação a ser executada
  modelProvider: text("model_provider"), // Ex: 'openai', 'anthropic', 'perplexity', 'custom'
  modelConfig: jsonb("model_config"), // Configurações específicas para o modelo de IA
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
  lastExecutedAt: timestamp("last_executed_at"), // Último momento em que a automação foi executada
});

// Tabela para armazenar fontes de dados para treinamento de IA
export const aiTrainingDataSources = pgTable("ai_training_data_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Nome descritivo da fonte de dados
  description: text("description"), // Descrição da fonte
  type: text("type").notNull(), // 'file', 'url', 'qa_pair', 'text'
  sourceUrl: text("source_url"), // URL de origem, se aplicável
  contentType: text("content_type"), // Tipo de conteúdo: 'pdf', 'text', 'json', 'html', etc.
  content: text("content"), // Conteúdo original, se for texto direto
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'processed', 'error'
  processingError: text("processing_error"), // Mensagem de erro, se houver
  metadata: jsonb("metadata"), // Metadados adicionais
  tags: text("tags").array(), // Tags para categorização
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
  processedAt: timestamp("processed_at"), // Quando foi processado pela última vez
});

// Tabela para armazenar os fragmentos de conhecimento extraídos das fontes
export const aiKnowledgeChunks = pgTable("ai_knowledge_chunks", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => aiTrainingDataSources.id).notNull(),
  content: text("content").notNull(), // Conteúdo do fragmento
  embedding: text("embedding"), // Vetor de embedding para busca semântica (armazenado como texto)
  metadata: jsonb("metadata"), // Metadados adicionais
  tokens: integer("tokens"), // Contagem de tokens no fragmento
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela para pares de perguntas e respostas
export const aiQaPairs = pgTable("ai_qa_pairs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(), // Pergunta
  answer: text("answer").notNull(), // Resposta
  category: text("category"), // Categoria para agrupamento
  tags: text("tags").array(), // Tags para categorização
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
});

// Relações para a tabela de regras de roteamento
export const routingRulesRelations = relations(routingRules, ({ one }) => ({
  channel: one(channels, {
    fields: [routingRules.channelId],
    references: [channels.id],
  }),
}));

// Relações para a tabela de histórico de roteamento
export const routingHistoryRelations = relations(routingHistory, ({ one }) => ({
  conversation: one(conversations, {
    fields: [routingHistory.conversationId],
    references: [conversations.id],
  }),
  rule: one(routingRules, {
    fields: [routingHistory.ruleId],
    references: [routingRules.id],
  }),
  assignedUser: one(users, {
    fields: [routingHistory.assignedTo],
    references: [users.id],
  }),
}));

// Relações para a tabela de fila de webhooks
export const webhookQueueRelations = relations(webhookQueue, ({ one }) => ({
  channel: one(channels, {
    fields: [webhookQueue.channelId],
    references: [channels.id],
  }),
}));

// Relações para a tabela de automações e respostas rápidas
export const automationsRelations = relations(automations, ({ one }) => ({
  channel: one(channels, {
    fields: [automations.channelId],
    references: [channels.id],
  }),
  creator: one(users, {
    fields: [automations.createdBy],
    references: [users.id],
  }),
}));

// Relações para a tabela de fontes de dados para treinamento de IA
export const aiTrainingDataSourcesRelations = relations(aiTrainingDataSources, ({ one, many }) => ({
  creator: one(users, {
    fields: [aiTrainingDataSources.createdBy],
    references: [users.id],
  }),
  knowledgeChunks: many(aiKnowledgeChunks),
}));

// Relações para a tabela de fragmentos de conhecimento
export const aiKnowledgeChunksRelations = relations(aiKnowledgeChunks, ({ one }) => ({
  source: one(aiTrainingDataSources, {
    fields: [aiKnowledgeChunks.sourceId],
    references: [aiTrainingDataSources.id],
  }),
}));

// Relações para a tabela de pares de perguntas e respostas
export const aiQaPairsRelations = relations(aiQaPairs, ({ one }) => ({
  creator: one(users, {
    fields: [aiQaPairs.createdBy],
    references: [users.id],
  }),
}));

// Atualizar as relações de contatos para incluir novas tabelas
export const contactsRelationsComplete = relations(contacts, ({ many }) => ({
  conversations: many(conversations),
  activities: many(activities),
  deals: many(deals),
}));

// Create Zod schemas for validation and type inference

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema para atualização de usuário
export const updateUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChannelSchema = createInsertSchema(channels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  lastMessageId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWebhookQueueSchema = createInsertSchema(webhookQueue).omit({
  id: true,
  attempts: true,
  status: true,
  lastError: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  processingTimeMs: true,
});

export const insertRoutingRuleSchema = createInsertSchema(routingRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoutingHistorySchema = createInsertSchema(routingHistory).omit({
  id: true,
  appliedAt: true,
});

export const insertAutomationSchema = createInsertSchema(automations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastExecutedAt: true,
});

// Schemas para IA
export const insertAiTrainingDataSourceSchema = createInsertSchema(aiTrainingDataSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  processedAt: true,
  status: true,
  processingError: true,
});

export const insertAiKnowledgeChunkSchema = createInsertSchema(aiKnowledgeChunks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiQaPairSchema = createInsertSchema(aiQaPairs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type Channel = typeof channels.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type WebhookQueueItem = typeof webhookQueue.$inferSelect;
export type InsertWebhookQueueItem = z.infer<typeof insertWebhookQueueSchema>;

export type RoutingRule = typeof routingRules.$inferSelect;
export type InsertRoutingRule = z.infer<typeof insertRoutingRuleSchema>;

export type RoutingHistory = typeof routingHistory.$inferSelect;
export type InsertRoutingHistory = z.infer<typeof insertRoutingHistorySchema>;

export type Automation = typeof automations.$inferSelect;
export type InsertAutomation = z.infer<typeof insertAutomationSchema>;

// Tabela de notificações
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // system, alert, info, success, warning, error, critical
  priority: text("priority").notNull(), // low, medium, high, urgent
  category: text("category").notNull(), // security, system, conversation, webhook, user, channel, automation, performance
  userId: integer("user_id").references(() => users.id), // Null para notificações de sistema
  metadata: jsonb("metadata"), // Dados adicionais em formato JSON
  requiresAction: boolean("requires_action").default(false).notNull(),
  actionUrl: text("action_url"),
  readAt: timestamp("read_at"), // Null se não foi lida
  expiresAt: timestamp("expires_at"), // Quando a notificação expira
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relações de notificações
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Tabela para templates de mensagens
export const messageTemplates = pgTable("message_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Nome do template
  content: text("content").notNull(), // Conteúdo do template com variáveis
  description: text("description"), // Descrição ou propósito do template
  category: text("category"), // Categoria para organização (ex: saudação, suporte, encerramento)
  tags: text("tags").array(), // Tags para facilitar a busca
  channelId: integer("channel_id").references(() => channels.id), // Opcional, se específico para um canal
  createdBy: integer("created_by").references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  usageCount: integer("usage_count").notNull().default(0), // Contador de uso
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relações para a tabela de templates de mensagens
export const messageTemplatesRelations = relations(messageTemplates, ({ one }) => ({
  channel: one(channels, {
    fields: [messageTemplates.channelId],
    references: [channels.id],
  }),
  creator: one(users, {
    fields: [messageTemplates.createdBy],
    references: [users.id],
  }),
}));

// Schema para inserção de notificações
export const insertNotificationSchema = createInsertSchema(notifications)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Schema para inserção de templates de mensagens
export const insertMessageTemplateSchema = createInsertSchema(messageTemplates)
  .omit({ id: true, createdAt: true, updatedAt: true, usageCount: true });

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;

// Tabela para métricas de desempenho de agentes
export const agentPerformance = pgTable("agent_performance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  // Métricas de tempo de resposta
  averageResponseTimeMs: integer("average_response_time_ms"), // Tempo médio de resposta em milissegundos
  averageFirstResponseTimeMs: integer("average_first_response_time_ms"), // Tempo médio de primeira resposta
  averageResolutionTimeMs: integer("average_resolution_time_ms"), // Tempo médio de resolução da conversa
  // Métricas de volume
  messagesCount: integer("messages_count").notNull().default(0), // Total de mensagens enviadas
  conversationsCount: integer("conversations_count").notNull().default(0), // Total de conversas atendidas
  resolvedConversationsCount: integer("resolved_conversations_count").notNull().default(0), // Conversas resolvidas
  // Métricas de qualidade
  csat: integer("csat"), // Customer Satisfaction Score (0-100)
  csatResponseCount: integer("csat_response_count").notNull().default(0), // Número de avaliações CSAT
  // Métricas de eficiência
  transferRate: integer("transfer_rate"), // Taxa de transferência de conversas (%)
  handleTimeMs: integer("handle_time_ms"), // Tempo médio de manuseio de conversas
  // Métricas de utilização
  onlineTimeMs: integer("online_time_ms").notNull().default(0), // Tempo online em milissegundos
  busyTimeMs: integer("busy_time_ms").notNull().default(0), // Tempo ocupado em milissegundos
  awayTimeMs: integer("away_time_ms").notNull().default(0), // Tempo ausente em milissegundos
  utilizationRate: integer("utilization_rate"), // Taxa de utilização (%)
  // Períodos de tempo para análise
  date: date("date").notNull(), // Data das métricas (agregadas por dia)
  weekNumber: integer("week_number"), // Número da semana no ano (1-53)
  monthNumber: integer("month_number"), // Número do mês (1-12)
  year: integer("year"), // Ano
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    userDateIndex: index("agent_performance_user_date_idx").on(table.userId, table.date),
    dateIndex: index("agent_performance_date_idx").on(table.date),
  };
});

// Relações para métricas de desempenho de agentes
export const agentPerformanceRelations = relations(agentPerformance, ({ one }) => ({
  user: one(users, {
    fields: [agentPerformance.userId],
    references: [users.id],
  }),
}));

// Tabela de pesquisas de satisfação do cliente
export const satisfactionSurveys = pgTable("satisfaction_surveys", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  userId: integer("user_id").references(() => users.id), // Agente avaliado
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  score: integer("score").notNull(), // Pontuação (geralmente 1-5)
  feedback: text("feedback"), // Comentário textual opcional
  surveyType: text("survey_type").notNull().default("csat"), // csat, nps, custom
  surveyData: jsonb("survey_data"), // Perguntas e respostas adicionais em formato JSON
  source: text("source").notNull(), // web, whatsapp, email, sms, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relações para pesquisas de satisfação
export const satisfactionSurveysRelations = relations(satisfactionSurveys, ({ one }) => ({
  conversation: one(conversations, {
    fields: [satisfactionSurveys.conversationId],
    references: [conversations.id],
  }),
  user: one(users, {
    fields: [satisfactionSurveys.userId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [satisfactionSurveys.contactId],
    references: [contacts.id],
  }),
}));

// Schemas de inserção para as novas tabelas
export const insertAgentPerformanceSchema = createInsertSchema(agentPerformance)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertSatisfactionSurveySchema = createInsertSchema(satisfactionSurveys)
  .omit({ id: true, createdAt: true });

// Tipos para as novas tabelas
export type AgentPerformance = typeof agentPerformance.$inferSelect;
export type InsertAgentPerformance = z.infer<typeof insertAgentPerformanceSchema>;

export type SatisfactionSurvey = typeof satisfactionSurveys.$inferSelect;
export type InsertSatisfactionSurvey = z.infer<typeof insertSatisfactionSurveySchema>;
