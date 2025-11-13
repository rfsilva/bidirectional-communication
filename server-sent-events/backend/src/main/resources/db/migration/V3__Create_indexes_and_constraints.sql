-- Migration V3: Índices adicionais e constraints para performance
-- Autor: SSE Demo Team
-- Data: 2024-01-15
-- Descrição: Otimizações de performance e integridade de dados (compatível com MySQL 8.0)

-- Índice composto para consultas frequentes (externos + data)
CREATE INDEX idx_external_created_at ON data_entities (is_external, created_at DESC);

-- Índice para consultas de estatísticas por período
CREATE INDEX idx_created_at_desc ON data_entities (created_at DESC);

-- Índice para busca por nome (MySQL 8.0+ suporta índices funcionais com sintaxe específica)
-- Usando índice normal por enquanto, funcional pode ser adicionado depois se necessário
CREATE INDEX idx_name_search ON data_entities (name);

-- Constraint para garantir que o nome não seja vazio
ALTER TABLE data_entities 
ADD CONSTRAINT chk_name_not_empty 
CHECK (TRIM(name) != '');

-- Constraint para garantir que o valor não seja vazio
ALTER TABLE data_entities 
ADD CONSTRAINT chk_value_not_empty 
CHECK (TRIM(data_value) != '');

-- Constraint para garantir datas válidas
ALTER TABLE data_entities 
ADD CONSTRAINT chk_valid_dates 
CHECK (updated_at IS NULL OR updated_at >= created_at);

-- Índice adicional para performance em consultas por tipo (externo/interno)
CREATE INDEX idx_external_name ON data_entities (is_external, name);

-- Índice para consultas temporais recentes (últimas 24h, etc.)
CREATE INDEX idx_recent_data ON data_entities (created_at DESC, is_external);