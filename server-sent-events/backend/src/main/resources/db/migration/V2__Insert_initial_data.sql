-- Migration V2: Inserção de dados iniciais
-- Autor: SSE Demo Team
-- Data: 2024-01-15
-- Descrição: Massa de dados inicial para demonstração do sistema

-- Dados internos (criados pelo sistema)
INSERT INTO data_entities (name, data_value, is_external, created_at) VALUES
('Sistema Inicializado', 'Aplicação SSE Demo iniciada com sucesso', FALSE, NOW() - INTERVAL 2 HOUR),
('Configuração Carregada', 'Configurações de I18N e banco de dados aplicadas', FALSE, NOW() - INTERVAL 2 HOUR),
('Produto Alpha', 'Produto interno em desenvolvimento', FALSE, NOW() - INTERVAL 1 HOUR),
('Serviço Beta', 'Serviço de notificações ativo', FALSE, NOW() - INTERVAL 1 HOUR),
('Dashboard Ativo', 'Interface de usuário funcionando', FALSE, NOW() - INTERVAL 45 MINUTE),
('API Documentada', 'Swagger UI disponível em /swagger-ui.html', FALSE, NOW() - INTERVAL 30 MINUTE),
('Testes Executados', 'Bateria de testes de conectividade concluída', FALSE, NOW() - INTERVAL 20 MINUTE),
('Logs Configurados', 'Sistema de logging multilíngue ativo', FALSE, NOW() - INTERVAL 15 MINUTE);

-- Dados externos (simulando importação de APIs externas)
INSERT INTO data_entities (name, data_value, is_external, created_at) VALUES
('Produto Externo A', 'Disponível (Importado da API)', TRUE, NOW() - INTERVAL 90 MINUTE),
('Produto Externo B', 'Em estoque (Importado da API)', TRUE, NOW() - INTERVAL 85 MINUTE),
('Serviço Externo X', 'Ativo (Importado da API)', TRUE, NOW() - INTERVAL 80 MINUTE),
('Serviço Externo Y', 'Manutenção (Importado da API)', TRUE, NOW() - INTERVAL 75 MINUTE),
('Item Gamma', 'Processando (Importado da API)', TRUE, NOW() - INTERVAL 70 MINUTE),
('Item Delta', 'Concluído (Importado da API)', TRUE, NOW() - INTERVAL 65 MINUTE),
('Recurso Premium', 'Disponível (Importado da API)', TRUE, NOW() - INTERVAL 60 MINUTE),
('Recurso Standard', 'Limitado (Importado da API)', TRUE, NOW() - INTERVAL 55 MINUTE),
('API Gateway', 'Operacional (Importado da API)', TRUE, NOW() - INTERVAL 50 MINUTE),
('Load Balancer', 'Balanceando (Importado da API)', TRUE, NOW() - INTERVAL 45 MINUTE);

-- Dados recentes para demonstrar funcionalidade em tempo real
INSERT INTO data_entities (name, data_value, is_external, created_at) VALUES
('Notificação Teste', 'Sistema de SSE funcionando perfeitamente', FALSE, NOW() - INTERVAL 10 MINUTE),
('Conexão Ativa', 'Cliente conectado via Server-Sent Events', FALSE, NOW() - INTERVAL 8 MINUTE),
('Dados Sincronizados', 'Última sincronização com APIs externas', TRUE, NOW() - INTERVAL 5 MINUTE),
('Status Operacional', 'Todos os sistemas funcionando normalmente', FALSE, NOW() - INTERVAL 3 MINUTE),
('Backup Realizado', 'Backup automático dos dados concluído', FALSE, NOW() - INTERVAL 1 MINUTE);