-- V8__Insert_initial_messages.sql
-- Inserção de mensagens iniciais para demonstração

-- Mensagens para o usuário admin (ID 1)
INSERT INTO user_messages (title, content, type, priority, is_read, is_external, external_source, user_id, created_at) VALUES
('Bem-vindo ao Sistema', 'Bem-vindo ao sistema de mensagens! Aqui você receberá notificações importantes.', 'INFO', 'NORMAL', FALSE, FALSE, NULL, 1, NOW() - INTERVAL 2 DAY),
('Sistema Atualizado', 'O sistema foi atualizado com novas funcionalidades de mensagens.', 'SUCCESS', 'NORMAL', TRUE, FALSE, NULL, 1, NOW() - INTERVAL 1 DAY),
('Relatório Mensal Disponível', 'Seu relatório mensal foi gerado e está disponível para download.', 'SUCCESS', 'HIGH', FALSE, TRUE, 'REPORT_SYSTEM', 1, NOW() - INTERVAL 12 HOUR),
('Backup Realizado', 'Backup automático dos dados foi realizado com sucesso.', 'SUCCESS', 'LOW', TRUE, TRUE, 'BACKUP_SYSTEM', 1, NOW() - INTERVAL 6 HOUR);

-- Mensagens para o usuário editor (ID 2)
INSERT INTO user_messages (title, content, type, priority, is_read, is_external, external_source, user_id, created_at) VALUES
('Acesso de Editor Concedido', 'Você agora tem permissões de editor no sistema.', 'INFO', 'NORMAL', TRUE, FALSE, NULL, 2, NOW() - INTERVAL 3 DAY),
('Nova Funcionalidade', 'Uma nova funcionalidade de edição foi adicionada ao sistema.', 'INFO', 'NORMAL', FALSE, FALSE, NULL, 2, NOW() - INTERVAL 1 DAY),
('Fatura Disponível', 'Sua fatura do mês está disponível para visualização.', 'INFO', 'NORMAL', FALSE, TRUE, 'BILLING_SYSTEM', 2, NOW() - INTERVAL 8 HOUR),
('Uso Alto de Recursos', 'Detectamos uso alto de recursos em sua conta. Monitore suas atividades.', 'WARNING', 'NORMAL', FALSE, TRUE, 'MONITORING_SYSTEM', 2, NOW() - INTERVAL 2 HOUR);

-- Mensagens para o usuário viewer (ID 3)
INSERT INTO user_messages (title, content, type, priority, is_read, is_external, external_source, user_id, created_at) VALUES
('Conta Criada', 'Sua conta foi criada com sucesso. Bem-vindo!', 'SUCCESS', 'NORMAL', TRUE, FALSE, NULL, 3, NOW() - INTERVAL 5 DAY),
('Primeiro Login', 'Obrigado por fazer seu primeiro login no sistema.', 'INFO', 'LOW', TRUE, FALSE, NULL, 3, NOW() - INTERVAL 4 DAY),
('Atualização de Segurança', 'Uma atualização de segurança foi aplicada ao sistema.', 'WARNING', 'HIGH', FALSE, TRUE, 'SECURITY_ALERTS', 3, NOW() - INTERVAL 10 HOUR),
('Sistema Operacional', 'Todos os sistemas estão funcionando normalmente.', 'SUCCESS', 'LOW', FALSE, TRUE, 'MONITORING_SYSTEM', 3, NOW() - INTERVAL 1 HOUR);

-- Mensagens adicionais para demonstrar diferentes cenários
INSERT INTO user_messages (title, content, type, priority, is_read, is_external, external_source, user_id, created_at) VALUES
-- Mensagens urgentes
('Falha no Backup', 'Houve uma falha no backup automático. Verifique suas configurações.', 'ERROR', 'URGENT', FALSE, TRUE, 'BACKUP_SYSTEM', 1, NOW() - INTERVAL 30 MINUTE),
('Login Suspeito Detectado', 'Detectamos um login de localização não usual. Se não foi você, altere sua senha.', 'WARNING', 'URGENT', FALSE, TRUE, 'SECURITY_ALERTS', 2, NOW() - INTERVAL 15 MINUTE),

-- Mensagens de diferentes tipos para o admin
('Manutenção Programada', 'Manutenção programada para hoje às 23h. Pode haver indisponibilidade temporária.', 'WARNING', 'HIGH', FALSE, TRUE, 'NOTIFICATION_CENTER', 1, NOW() - INTERVAL 4 HOUR),
('Pagamento Confirmado', 'Seu pagamento foi processado com sucesso. Obrigado!', 'SUCCESS', 'LOW', TRUE, TRUE, 'BILLING_SYSTEM', 1, NOW() - INTERVAL 3 HOUR),

-- Mensagens não lidas para teste
('Relatório Semanal', CONCAT('Seu relatório semanal foi gerado. Código: RPT-', CAST(UNIX_TIMESTAMP() AS CHAR)), 'SUCCESS', 'NORMAL', FALSE, TRUE, 'REPORT_SYSTEM', 2, NOW() - INTERVAL 1 HOUR),
('Erro na Geração de Relatório', 'Houve um erro ao gerar seu relatório. Tente novamente em alguns minutos.', 'ERROR', 'HIGH', FALSE, TRUE, 'REPORT_SYSTEM', 3, NOW() - INTERVAL 45 MINUTE);