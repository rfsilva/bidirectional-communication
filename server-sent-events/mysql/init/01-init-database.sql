-- Script de inicialização do banco de dados MySQL
-- Este script é executado automaticamente quando o container MySQL é criado

-- Criar o banco de dados se não existir
CREATE DATABASE IF NOT EXISTS sse_demo 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Usar o banco de dados
USE sse_demo;

-- Criar usuário com permissões amplas para resolver problemas de conectividade
CREATE USER IF NOT EXISTS 'sse_user'@'%' IDENTIFIED BY 'sse_password';
CREATE USER IF NOT EXISTS 'sse_user'@'localhost' IDENTIFIED BY 'sse_password';
CREATE USER IF NOT EXISTS 'sse_user'@'172.%' IDENTIFIED BY 'sse_password';

-- Conceder todas as permissões
GRANT ALL PRIVILEGES ON sse_demo.* TO 'sse_user'@'%';
GRANT ALL PRIVILEGES ON sse_demo.* TO 'sse_user'@'localhost';
GRANT ALL PRIVILEGES ON sse_demo.* TO 'sse_user'@'172.%';

-- Flush privileges para aplicar as mudanças
FLUSH PRIVILEGES;

-- Configurações de timezone e charset
SET time_zone = '+00:00';
SET NAMES utf8mb4;

-- Mostrar usuários criados para debug
SELECT User, Host FROM mysql.user WHERE User = 'sse_user';

-- Log de inicialização
SELECT 'Database sse_demo initialized successfully' AS status;