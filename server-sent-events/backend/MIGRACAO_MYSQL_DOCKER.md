# 🗄️ Migração para MySQL + Docker + Flyway

## 📋 Resumo das Alterações Implementadas

O backend foi completamente migrado de H2 para MySQL, com implementação de migrations via Flyway e containerização completa com Docker.

## 🔧 Alterações Realizadas

### 1. **Migração de H2 para MySQL**
- ✅ **Driver MySQL** adicionado ao `pom.xml`
- ✅ **Configuração de datasource** atualizada para MySQL
- ✅ **Dialect Hibernate** alterado para `MySQLDialect`
- ✅ **H2 mantido apenas para testes**

### 2. **Implementação do Flyway**
- ✅ **Dependências Flyway** adicionadas
- ✅ **Plugin Maven** configurado
- ✅ **4 migrations criadas** com estrutura completa
- ✅ **Massa de dados inicial** implementada

### 3. **Containerização com Docker**
- ✅ **Dockerfile multi-stage** para backend
- ✅ **docker-compose.yml** completo
- ✅ **Dockerfile para frontend** (opcional)
- ✅ **Configuração Nginx** para SPA

### 4. **Scripts de Automação**
- ✅ **Script de build e deploy** (`build-and-run.sh`)
- ✅ **Gerenciador de banco** (`database-manager.sh`)
- ✅ **Makefile** com comandos facilitados

## 📁 Estrutura de Arquivos Criados

```
projeto/
├── backend/
│   ├── Dockerfile
│   ├── src/main/resources/
│   │   ├── db/migration/
│   │   │   ├── V1__Create_data_entities_table.sql
│   │   │   ├── V2__Insert_initial_data.sql
│   │   │   ├── V3__Create_indexes_and_constraints.sql
│   │   │   └── V4__Insert_demo_data.sql
│   │   ├── application-docker.yml
│   │   └── application-dev.yml
│   └── pom.xml (atualizado)
├── frontend/
│   ├── Dockerfile
│   └── nginx.conf
├── mysql/
│   └── init/
│       └── 01-init-database.sql
├── scripts/
│   ├── build-and-run.sh
│   └── database-manager.sh
├── docker-compose.yml
└── Makefile
```

## 🗄️ Estrutura do Banco de Dados

### Tabela Principal: `data_entities`
```sql
CREATE TABLE data_entities (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    data_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    is_external BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    -- Índices para performance
    INDEX idx_created_at (created_at),
    INDEX idx_is_external (is_external),
    INDEX idx_name (name),
    INDEX idx_external_created_at (is_external, created_at DESC)
);
```

### Dados Iniciais
- **25 registros internos**: Dados do sistema, monitoramento, etc.
- **15 registros externos**: Simulação de APIs externas
- **Dados temporais**: Distribuídos ao longo de 5 horas para demonstração

## 🐳 Configuração Docker

### Services Configurados
1. **MySQL 8.0**
   - Porta: 3306
   - Database: `sse_demo`
   - User: `sse_user`
   - Password: `sse_password`
   - Volume persistente

2. **Backend Spring Boot**
   - Porta: 8080
   - Profile: `docker`
   - Health check configurado
   - Logs persistentes

3. **Frontend Angular** (opcional)
   - Porta: 4200 (via Nginx)
   - Proxy para API configurado

4. **Adminer** (opcional)
   - Porta: 8081
   - Interface web para MySQL

## 🚀 Como Executar

### Opção 1: Makefile (Recomendado)
```bash
# Ver comandos disponíveis
make help

# Desenvolvimento local (MySQL via Docker, app local)
make dev

# Ambiente completo Docker
make docker

# Build para produção
make prod

# Verificar status
make status

# Ver logs
make logs
```

### Opção 2: Scripts Diretos
```bash
# Desenvolvimento
./scripts/build-and-run.sh dev

# Docker completo
./scripts/build-and-run.sh docker

# Produção
./scripts/build-and-run.sh prod
```

### Opção 3: Docker Compose Manual
```bash
# Subir todos os serviços
docker-compose up -d

# Apenas MySQL
docker-compose up -d mysql

# Ver logs
docker-compose logs -f
```

## 🗄️ Gerenciamento do Banco

### Comandos Disponíveis
```bash
# Via Makefile
make db-check      # Verificar conexão
make db-migrate    # Executar migrations
make db-status     # Status das migrations
make db-backup     # Criar backup
make db-stats      # Estatísticas
make db-connect    # Conectar via CLI

# Via script direto
./scripts/database-manager.sh [comando]
```

### Migrations Flyway
```bash
# Executar migrations manualmente
cd backend
mvn flyway:migrate

# Ver status
mvn flyway:info

# Limpar banco (apenas desenvolvimento)
mvn flyway:clean
```

## 📊 Massa de Dados Inicial

### Categorias de Dados
1. **Sistema** (8 registros)
   - Inicialização, configuração, logs, etc.

2. **Produtos/Serviços** (12 registros)
   - Produtos internos e serviços externos

3. **Monitoramento** (8 registros)
   - CPU, memória, rede, integrações

4. **Eventos** (10 registros)
   - Startup, migrations, testes, backups

5. **Tempo Real** (7 registros)
   - Dados recentes para demonstrar SSE

### Distribuição Temporal
- **5 horas atrás**: Dados de inicialização
- **3-4 horas atrás**: Produtos e serviços
- **1-2 horas atrás**: Monitoramento e eventos
- **Últimos 30 min**: Dados em tempo real

## 🔧 Configurações por Ambiente

### Desenvolvimento (`dev`)
- MySQL via Docker
- Aplicação local
- Logs detalhados
- Hot reload

### Docker (`docker`)
- Tudo containerizado
- Logs otimizados
- Health checks
- Volumes persistentes

### Produção (`prod`)
- Build otimizado
- Logs estruturados
- Configurações de segurança
- Multi-stage builds

## 🎯 URLs de Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Backend | http://localhost:8080 | API REST |
| Frontend | http://localhost:4200 | Interface Angular |
| Swagger | http://localhost:8080/swagger-ui.html | Documentação API |
| Adminer | http://localhost:8081 | Interface MySQL |
| Health | http://localhost:8080/api/health | Health check |

## 🔍 Troubleshooting

### Problemas Comuns

1. **MySQL não inicia**
   ```bash
   # Verificar logs
   docker-compose logs mysql
   
   # Resetar volume
   docker-compose down -v
   docker-compose up -d mysql
   ```

2. **Backend não conecta ao MySQL**
   ```bash
   # Verificar se MySQL está pronto
   make db-check
   
   # Aguardar mais tempo
   sleep 60 && docker-compose restart backend
   ```

3. **Migrations falham**
   ```bash
   # Verificar status
   make db-status
   
   # Executar manualmente
   make db-migrate
   ```

4. **Porta já em uso**
   ```bash
   # Verificar processos
   lsof -i :8080
   lsof -i :3306
   
   # Parar containers
   make docker-down
   ```

## 📈 Monitoramento

### Health Checks
- **Backend**: `GET /api/health`
- **MySQL**: `mysqladmin ping`
- **Docker**: Health checks automáticos

### Logs
```bash
# Todos os logs
make logs

# Apenas backend
make logs-backend

# Apenas MySQL
make logs-mysql
```

### Métricas
```bash
# Estatísticas do banco
make db-stats

# Status dos containers
make status

# Verificar saúde geral
make health
```

## 🎉 Resultado Final

### ✅ O que funciona agora:
1. **MySQL como banco principal** com dados persistentes
2. **Flyway gerenciando migrations** automaticamente
3. **Docker containerizando tudo** com health checks
4. **Massa de dados rica** para demonstrações
5. **Scripts automatizados** para facilitar desenvolvimento
6. **Múltiplos ambientes** (dev, docker, prod)
7. **Backup e restore** automatizados
8. **Monitoramento completo** com logs e métricas

### 🔄 Fluxo Completo:
1. **`make docker`** → Sobe MySQL + Backend + Frontend
2. **Flyway executa** migrations automaticamente
3. **Dados iniciais** são carregados
4. **Health checks** verificam se tudo está funcionando
5. **Aplicação disponível** em http://localhost:8080
6. **Interface web** em http://localhost:4200

A aplicação agora está completamente containerizada e pronta para produção! 🚀✨