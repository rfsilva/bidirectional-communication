-- V7__Create_user_messages_table.sql
-- Criação da tabela de mensagens para usuários

CREATE TABLE user_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT 'Título da mensagem',
    content VARCHAR(1000) NOT NULL COMMENT 'Conteúdo da mensagem',
    type ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR') NOT NULL DEFAULT 'INFO' COMMENT 'Tipo da mensagem',
    priority ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL' COMMENT 'Prioridade da mensagem',
    is_read BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Indica se a mensagem foi lida',
    is_external BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Indica se a mensagem veio de sistema externo',
    external_source VARCHAR(100) NULL COMMENT 'Fonte externa da mensagem',
    user_id BIGINT NOT NULL COMMENT 'ID do usuário destinatário',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e hora de criação',
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data e hora da última atualização',
    read_at TIMESTAMP NULL COMMENT 'Data e hora em que foi lida',
    
    -- Chave estrangeira para usuários
    CONSTRAINT fk_messages_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Índices para melhor performance
    INDEX idx_messages_user_id (user_id),
    INDEX idx_messages_created_at (created_at),
    INDEX idx_messages_is_read (is_read),
    INDEX idx_messages_type (type),
    INDEX idx_messages_priority (priority),
    INDEX idx_messages_external_source (external_source),
    INDEX idx_messages_user_unread (user_id, is_read),
    INDEX idx_messages_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mensagens para usuários do sistema';