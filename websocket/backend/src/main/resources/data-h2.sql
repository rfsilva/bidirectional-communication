-- Script para inicializar dados no H2 (profile test)

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'VIEWER',
    avatar_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Criar tabela de dados
CREATE TABLE IF NOT EXISTS data_entities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    is_external BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Inserir usuários de teste
INSERT INTO users (username, email, password, first_name, last_name, role, is_active) VALUES
('admin', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Administrador', 'Sistema', 'ADMIN', true),
('editor', 'editor@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Editor', 'Sistema', 'EDITOR', true),
('viewer1', 'viewer1@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Visualizador', 'Um', 'VIEWER', true),
('viewer2', 'viewer2@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Visualizador', 'Dois', 'VIEWER', true),
('viewer3', 'viewer3@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Visualizador', 'Três', 'VIEWER', true);

-- Inserir alguns dados de exemplo
INSERT INTO data_entities (name, value, is_external) VALUES
('Item Inicial 1', 'Valor de exemplo 1', false),
('Item Inicial 2', 'Valor de exemplo 2', false),
('Item Externo 1', 'Dados vindos de API externa', true),
('Item Externo 2', 'Mais dados externos', true);