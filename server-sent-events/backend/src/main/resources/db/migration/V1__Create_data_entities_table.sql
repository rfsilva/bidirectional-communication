-- Migration V1: Criação da tabela data_entities
-- Autor: SSE Demo Team
-- Data: 2024-01-15
-- Descrição: Tabela principal para armazenar entidades de dados (internas e externas)

CREATE TABLE data_entities (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT 'Nome do item de dados',
    data_value VARCHAR(255) NOT NULL COMMENT 'Valor ou descrição do item',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e hora de criação',
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data e hora da última atualização',
    is_external BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Indica se o dado é de origem externa',
    
    PRIMARY KEY (id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_external (is_external),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Entidades de dados do sistema SSE Demo';