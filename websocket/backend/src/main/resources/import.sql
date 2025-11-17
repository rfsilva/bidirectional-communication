-- Script para inserir dados iniciais no H2 (executado automaticamente)

-- Inserir usuários de teste (senha: admin123, editor123, viewer123)
-- Hash BCrypt para todas as senhas: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.
INSERT INTO users (username, email, password, first_name, last_name, role, is_active, created_at, updated_at) VALUES
('admin', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Administrador', 'Sistema', 'ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('editor', 'editor@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Editor', 'Sistema', 'EDITOR', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('viewer1', 'viewer1@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Visualizador', 'Um', 'VIEWER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('viewer2', 'viewer2@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Visualizador', 'Dois', 'VIEWER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('viewer3', 'viewer3@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Visualizador', 'Três', 'VIEWER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);