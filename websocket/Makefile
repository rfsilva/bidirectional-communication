# Makefile para SSE Demo
# Facilita a execução de comandos comuns

.PHONY: help dev docker prod clean logs backup restore test

# Variáveis
DOCKER_COMPOSE = docker-compose
MAVEN = mvn

# Comando padrão
help: ## Mostrar ajuda
	@echo "SSE Demo - Comandos Disponíveis:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Desenvolvimento
dev: ## Executar em modo desenvolvimento
	@chmod +x scripts/build-and-run.sh
	@./scripts/build-and-run.sh dev

dev-backend: ## Executar apenas backend em desenvolvimento
	@cd backend && $(MAVEN) spring-boot:run -Dspring-boot.run.profiles=dev

dev-frontend: ## Executar apenas frontend em desenvolvimento
	@cd frontend && npm start

# Docker
docker: ## Executar tudo via Docker
	@chmod +x scripts/build-and-run.sh
	@./scripts/build-and-run.sh docker

docker-build: ## Build das imagens Docker
	@$(DOCKER_COMPOSE) build

docker-up: ## Subir containers
	@$(DOCKER_COMPOSE) up -d

docker-down: ## Parar containers
	@$(DOCKER_COMPOSE) down

docker-restart: ## Reiniciar containers
	@$(DOCKER_COMPOSE) restart

# Produção
prod: ## Build para produção
	@chmod +x scripts/build-and-run.sh
	@./scripts/build-and-run.sh prod

# Limpeza
clean: ## Limpar containers e volumes
	@$(DOCKER_COMPOSE) down -v
	@docker system prune -f

clean-all: ## Limpeza completa (incluindo imagens)
	@$(DOCKER_COMPOSE) down -v --rmi all
	@docker system prune -af

# Logs
logs: ## Mostrar logs dos containers
	@$(DOCKER_COMPOSE) logs -f

logs-backend: ## Mostrar logs apenas do backend
	@$(DOCKER_COMPOSE) logs -f backend

logs-mysql: ## Mostrar logs apenas do MySQL
	@$(DOCKER_COMPOSE) logs -f mysql

# Banco de dados
db-check: ## Verificar conexão com banco
	@chmod +x scripts/database-manager.sh
	@./scripts/database-manager.sh check

db-migrate: ## Executar migrations
	@chmod +x scripts/database-manager.sh
	@./scripts/database-manager.sh migrate

db-status: ## Status das migrations
	@chmod +x scripts/database-manager.sh
	@./scripts/database-manager.sh status

db-backup: ## Criar backup do banco
	@chmod +x scripts/database-manager.sh
	@./scripts/database-manager.sh backup

db-stats: ## Mostrar estatísticas do banco
	@chmod +x scripts/database-manager.sh
	@./scripts/database-manager.sh stats

db-connect: ## Conectar ao banco via CLI
	@chmod +x scripts/database-manager.sh
	@./scripts/database-manager.sh connect

db-reset: ## Resetar banco (CUIDADO!)
	@chmod +x scripts/database-manager.sh
	@./scripts/database-manager.sh reset

# Testes
test: ## Executar testes
	@cd backend && $(MAVEN) test

test-integration: ## Executar testes de integração
	@cd backend && $(MAVEN) test -Dtest=**/*IntegrationTest

# Build
build: ## Build do backend
	@cd backend && $(MAVEN) clean package

build-skip-tests: ## Build sem executar testes
	@cd backend && $(MAVEN) clean package -DskipTests

# Utilitários
status: ## Status dos serviços
	@$(DOCKER_COMPOSE) ps

health: ## Verificar saúde dos serviços
	@echo "Verificando saúde dos serviços..."
	@curl -f http://localhost:8080/api/health || echo "Backend não está respondendo"
	@curl -f http://localhost:4200/health || echo "Frontend não está respondendo"

install: ## Instalar dependências
	@cd backend && $(MAVEN) dependency:resolve
	@cd frontend && npm install

# Desenvolvimento rápido
quick-start: docker-down docker-build docker-up ## Start rápido (down -> build -> up)
	@echo "Aguardando serviços inicializarem..."
	@sleep 30
	@make status

# Informações
info: ## Mostrar informações do projeto
	@echo "SSE Demo - Informações do Projeto"
	@echo "=================================="
	@echo "Backend:  http://localhost:8080"
	@echo "Frontend: http://localhost:4200"
	@echo "Swagger:  http://localhost:8080/swagger-ui.html"
	@echo "Adminer:  http://localhost:8081"
	@echo ""
	@echo "Banco de dados:"
	@echo "Host: localhost:3306"
	@echo "Database: sse_demo"
	@echo "User: sse_user"
	@echo "Password: sse_password"