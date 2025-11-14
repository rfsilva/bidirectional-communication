-- Migration V6: Inserção de usuários iniciais
-- Autor: SSE Demo Team
-- Data: 2024-01-15
-- Descrição: Massa de dados inicial de usuários com diferentes perfis

-- Inserir usuários iniciais
-- SENHAS (todas criptografadas com BCrypt strength 10):
-- admin: admin123
-- editor: editor123  
-- viewer1, viewer2, viewer3: viewer123

INSERT INTO users (username, email, password, first_name, last_name, role, is_active, created_at) VALUES
-- Administrador (senha: admin123)
('admin', 'admin@ssedemo.com', '$2a$12$HoF5EGXpspyM8D3f8opey.BUnjvkAjDJxV1h9bcTj/Vx/cboM.W3K', 'Administrador', 'Sistema', 'ADMIN', TRUE, NOW() - INTERVAL 30 DAY),

-- Editor (senha: editor123)  
('editor', 'editor@ssedemo.com', '$2a$12$YwvfzRU3Coo9j/MYFc4Wd.yDlAOKMXdaksZeZFuAIpbBnSDWWYRrC', 'Editor', 'Principal', 'EDITOR', TRUE, NOW() - INTERVAL 25 DAY),

-- Visualizadores (senha: viewer123)
('viewer1', 'viewer1@ssedemo.com', '$2a$12$PV1zZdHo16U9Mjd35IAaTeUkGbhTOi3dzF6owiaCgKgSPYBqz6J8y', 'João', 'Silva', 'VIEWER', TRUE, NOW() - INTERVAL 20 DAY),
('viewer2', 'viewer2@ssedemo.com', '$2a$12$PV1zZdHo16U9Mjd35IAaTeUkGbhTOi3dzF6owiaCgKgSPYBqz6J8y', 'Maria', 'Santos', 'VIEWER', TRUE, NOW() - INTERVAL 15 DAY),
('viewer3', 'viewer3@ssedemo.com', '$2a$12$PV1zZdHo16U9Mjd35IAaTeUkGbhTOi3dzF6owiaCgKgSPYBqz6J8y', 'Pedro', 'Costa', 'VIEWER', TRUE, NOW() - INTERVAL 10 DAY);

-- Atualizar alguns últimos logins para simular atividade
UPDATE users SET last_login = NOW() - INTERVAL 1 HOUR WHERE username = 'admin';
UPDATE users SET last_login = NOW() - INTERVAL 3 HOUR WHERE username = 'editor';
UPDATE users SET last_login = NOW() - INTERVAL 1 DAY WHERE username = 'viewer1';
UPDATE users SET last_login = NOW() - INTERVAL 2 DAY WHERE username = 'viewer2';