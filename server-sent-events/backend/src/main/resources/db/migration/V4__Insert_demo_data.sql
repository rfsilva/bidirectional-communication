-- Migration V4: Dados adicionais para demonstração completa
-- Autor: SSE Demo Team
-- Data: 2024-01-15
-- Descrição: Massa de dados mais robusta para testes e demonstrações

-- Dados de produtos e serviços variados
INSERT INTO data_entities (name, data_value, is_external, created_at) VALUES
-- Produtos internos
('Produto Premium', 'Versão premium com recursos avançados', FALSE, NOW() - INTERVAL 3 HOUR),
('Produto Standard', 'Versão padrão para uso geral', FALSE, NOW() - INTERVAL 3 HOUR),
('Produto Basic', 'Versão básica para iniciantes', FALSE, NOW() - INTERVAL 3 HOUR),
('Módulo Analytics', 'Sistema de análise de dados integrado', FALSE, NOW() - INTERVAL 2 HOUR + INTERVAL 30 MINUTE),
('Módulo Reports', 'Gerador de relatórios automáticos', FALSE, NOW() - INTERVAL 2 HOUR + INTERVAL 15 MINUTE),
('Módulo Security', 'Sistema de segurança e autenticação', FALSE, NOW() - INTERVAL 2 HOUR),

-- Serviços externos simulados
('API Weather Service', 'Ativo - Fornecendo dados meteorológicos', TRUE, NOW() - INTERVAL 4 HOUR),
('API Payment Gateway', 'Operacional - Processando pagamentos', TRUE, NOW() - INTERVAL 4 HOUR + INTERVAL 15 MINUTE),
('API Notification Service', 'Disponível - Enviando notificações', TRUE, NOW() - INTERVAL 4 HOUR + INTERVAL 30 MINUTE),
('API User Management', 'Online - Gerenciando usuários', TRUE, NOW() - INTERVAL 4 HOUR + INTERVAL 45 MINUTE),
('API File Storage', 'Ativo - Armazenamento de arquivos', TRUE, NOW() - INTERVAL 3 HOUR + INTERVAL 30 MINUTE),
('API Email Service', 'Funcionando - Envio de emails', TRUE, NOW() - INTERVAL 3 HOUR + INTERVAL 15 MINUTE),

-- Dados de monitoramento e status
('CPU Usage Monitor', 'Uso atual: 45% - Normal', FALSE, NOW() - INTERVAL 1 HOUR),
('Memory Usage Monitor', 'Uso atual: 62% - Normal', FALSE, NOW() - INTERVAL 1 HOUR + INTERVAL 5 MINUTE),
('Disk Space Monitor', 'Espaço livre: 78% - OK', FALSE, NOW() - INTERVAL 1 HOUR + INTERVAL 10 MINUTE),
('Network Latency', 'Latência média: 12ms - Excelente', FALSE, NOW() - INTERVAL 1 HOUR + INTERVAL 15 MINUTE),

-- Dados de integração externa
('External CRM Sync', 'Última sincronização: Sucesso', TRUE, NOW() - INTERVAL 2 HOUR),
('External ERP Integration', 'Status: Conectado e sincronizando', TRUE, NOW() - INTERVAL 2 HOUR + INTERVAL 10 MINUTE),
('External Analytics Feed', 'Dados recebidos: 1.2M registros', TRUE, NOW() - INTERVAL 1 HOUR + INTERVAL 30 MINUTE),
('External Backup Service', 'Backup automático: Concluído', TRUE, NOW() - INTERVAL 1 HOUR + INTERVAL 45 MINUTE),

-- Dados de eventos do sistema
('System Startup', 'Aplicação iniciada com sucesso', FALSE, NOW() - INTERVAL 5 HOUR),
('Database Migration', 'Flyway executou 4 migrations', FALSE, NOW() - INTERVAL 5 HOUR + INTERVAL 2 MINUTE),
('SSL Certificate Check', 'Certificado válido até 2025-01-15', FALSE, NOW() - INTERVAL 4 HOUR + INTERVAL 30 MINUTE),
('Security Scan', 'Varredura de segurança: Nenhuma vulnerabilidade', FALSE, NOW() - INTERVAL 3 HOUR + INTERVAL 45 MINUTE),
('Performance Test', 'Teste de carga: 1000 req/s - Aprovado', FALSE, NOW() - INTERVAL 2 HOUR + INTERVAL 20 MINUTE),

-- Dados recentes para demonstrar tempo real
('Live Connection Test', 'Teste de conectividade em tempo real', FALSE, NOW() - INTERVAL 30 MINUTE),
('SSE Stream Active', 'Stream de eventos funcionando', FALSE, NOW() - INTERVAL 25 MINUTE),
('Real-time Sync', 'Sincronização em tempo real ativa', TRUE, NOW() - INTERVAL 20 MINUTE),
('Auto-refresh Enabled', 'Atualização automática habilitada', FALSE, NOW() - INTERVAL 15 MINUTE),
('Live Dashboard', 'Dashboard atualizado em tempo real', FALSE, NOW() - INTERVAL 10 MINUTE),
('Current Session', 'Sessão ativa do usuário', FALSE, NOW() - INTERVAL 5 MINUTE),
('Latest Update', 'Última atualização do sistema', FALSE, NOW() - INTERVAL 2 MINUTE);