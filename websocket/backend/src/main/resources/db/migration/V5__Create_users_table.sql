-- Migration V5: Criação da tabela de usuários
-- Autor: SSE Demo Team
-- Data: 2024-01-15
-- Descrição: Tabela para autenticação e autorização de usuários

CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT 'Nome de usuário único',
    email VARCHAR(255) NOT NULL UNIQUE COMMENT 'Email do usuário',
    password VARCHAR(255) NOT NULL COMMENT 'Senha criptografada',
    first_name VARCHAR(100) NOT NULL COMMENT 'Primeiro nome',
    last_name VARCHAR(100) NOT NULL COMMENT 'Sobrenome',
    role ENUM('ADMIN', 'EDITOR', 'VIEWER') NOT NULL COMMENT 'Perfil de acesso',
    avatar_url VARCHAR(500) NULL COMMENT 'URL do avatar do usuário',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indica se o usuário está ativo',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação',
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data de atualização',
    last_login TIMESTAMP NULL COMMENT 'Data do último login',
    
    PRIMARY KEY (id),
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active),
    INDEX idx_created_at (created_at),
    INDEX idx_last_login (last_login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Usuários do sistema com controle de acesso';