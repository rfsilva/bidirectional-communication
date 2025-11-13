# 🚀 SSE Demo - Aplicação Completa

## 📋 Visão Geral

Aplicação completa demonstrando Server-Sent Events com:
- **Backend**: Spring Boot 3 + MySQL + Flyway + Lombok + I18N
- **Frontend**: Angular 18 com interceptor I18N automático
- **Infraestrutura**: Docker + docker-compose + scripts de automação

## 🎯 Funcionalidades Implementadas

### ✅ Backend
- [x] **Lombok** para redução de boilerplate
- [x] **I18N** com 4 idiomas (pt, en, es, it)
- [x] **MySQL** como banco principal
- [x] **Flyway** para migrations
- [x] **Docker** containerização completa
- [x] **Massa de dados** inicial rica
- [x] **SSE** notificações em tempo real
- [x] **API REST** completa com Swagger

### ✅ Frontend
- [x] **Interceptor automático** adiciona ?lang=pt
- [x] **Interface I18N** com seletor de idiomas
- [x] **Dashboard em tempo real** com SSE
- [x] **Testes de conectividade** integrados
- [x] **Docker** containerização opcional

## 🚀 Como Executar

### Pré-requisitos
- Docker e Docker Compose
- Java 21 (para desenvolvimento local)
- Maven 3.9+ (para desenvolvimento local)
- Node.js 18+ (para frontend local)

### Opção 1: Docker Completo (Recomendado)
```bash
# 1. Clonar o repositório
git clone <repo-url>
cd sse-demo

# 2. Executar via Makefile
make docker

# OU via script direto
./scripts/build-and-run.sh docker

# OU via docker-compose manual
docker-compose up -d
```

### Opção 2: Desenvolvimento Local
```bash
# 1. Subir apenas MySQL via Docker
docker-compose up -d mysql

# 2. Aguardar MySQL inicializar
sleep 30

# 3. Executar backend localmente
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 4. Em outro terminal, executar frontend
cd frontend
npm install
npm start
```

### Opção 3: Via Makefile (Mais Fácil)
```bash
# Ver todos os comandos disponíveis
make help

# Desenvolvimento local
make dev

# Docker completo
make docker

# Build para produção
make prod

# Ver logs
make logs

# Status dos serviços
make status
```

## 🌐 URLs de Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:4200 | Interface Angular |
| **Backend API** | http://localhost:8080 | API REST |
| **Swagger UI** | http://localhost:8080/swagger-ui.html | Documentação interativa |
| **Adminer** | http://localhost:8081 | Interface MySQL |
| **Health Check** | http://localhost:8080/api/health | Status da aplicação |

## 🗄️ Banco de Dados

### Configuração MySQL
- **Host**: localhost:3306
- **Database**: sse_demo
- **User**: sse_user
- **Password**: sse_password

### Gerenciamento via Scripts
```bash
# Verificar conexão
make db-check

# Executar migrations
make db-migrate

# Ver status das migrations
make db-status

# Criar backup
make db-backup

# Ver estatísticas
make db-stats

# Conectar via CLI
make db-connect
```

## 🌍 Internacionalização (I18N)

### Comportamento Atual
- **Backend padrão**: Inglês
- **Frontend solicita**: Português (via ?lang=pt automático)
- **Interceptor ativo**: Adiciona parâmetro automaticamente
- **Idiomas suportados**: pt, en, es, it

### Testando I18N
```bash
# Português (padrão do frontend)
curl http://localhost:8080/api/health
# Resposta: {"message": "Serviço está funcionando"}

# Inglês (forçado)
curl "http://localhost:8080/api/health?lang=en"
# Resposta: {"message": "Service is running"}

# Espanhol
curl "http://localhost:8080/api/health?lang=es"
# Resposta: {"message": "El servicio está funcionando"}
```

## 🐳 Docker

### Estrutura de Containers
```yaml
services:
  mysql:     # Banco de dados
  backend:   # Spring Boot API
  frontend:  # Angular + Nginx
  adminer:   # Interface MySQL
```

### Comandos Docker
```bash
# Subir todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar tudo
docker-compose down

# Limpar volumes (CUIDADO!)
docker-compose down -v
```

## 📊 Massa de Dados Inicial

### Dados Carregados Automaticamente
- **40+ registros** distribuídos temporalmente
- **Dados internos**: Sistema, produtos, monitoramento
- **Dados externos**: APIs simuladas, integrações
- **Dados recentes**: Para demonstrar tempo real

### Categorias
1. **Sistema** (8 registros): Inicialização, configuração
2. **Produtos** (12 registros): Internos e externos
3. **Monitoramento** (8 registros): CPU, memória, rede
4. **Eventos** (10 registros): Backups, testes, migrations
5. **Tempo Real** (7 registros): Dados recentes para SSE

## 🧪 Testando a Aplicação

### 1. Verificar se tudo está funcionando
```bash
# Status geral
make status

# Health check
make health

# Logs em tempo real
make logs
```

### 2. Testar SSE no Frontend
1. Abrir http://localhost:4200
2. Observar seção "Informações de Internacionalização"
3. Clicar em "Teste SSE" para enviar notificação
4. Verificar notificações em tempo real no painel direito

### 3. Testar I18N
1. No dashboard, alterar idioma usando os botões
2. Observar mudança nas próximas requisições
3. Verificar Network tab do navegador para ver ?lang=

### 4. Testar API via Swagger
1. Abrir http://localhost:8080/swagger-ui.html
2. Testar endpoints com diferentes ?lang=
3. Observar respostas traduzidas

## 🔧 Desenvolvimento

### Estrutura do Projeto
```
sse-demo/
├── backend/                 # Spring Boot
│   ├── src/main/java/      # Código Java
│   ├── src/main/resources/ # Configurações e migrations
│   └── Dockerfile          # Container backend
├── frontend/               # Angular
│   ├── src/app/           # Código TypeScript
│   ├── Dockerfile         # Container frontend
│   └── nginx.conf         # Configuração Nginx
├── mysql/init/            # Scripts inicialização MySQL
├── scripts/               # Scripts de automação
├── docker-compose.yml     # Orquestração containers
└── Makefile              # Comandos facilitados
```

### Adicionando Novos Idiomas
1. **Backend**: Criar `messages_[idioma].properties`
2. **Frontend**: Adicionar ao `AVAILABLE_LANGUAGES`
3. **Configuração**: Atualizar `supported-locales`

### Adicionando Novas Migrations
```bash
# Criar nova migration
touch backend/src/main/resources/db/migration/V5__Nova_migration.sql

# Executar
make db-migrate
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Porta 8080 já em uso**
   ```bash
   # Windows
   netstat -ano | findstr :8080
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -ti:8080 | xargs kill -9
   ```

2. **MySQL não inicia**
   ```bash
   # Ver logs
   docker-compose logs mysql
   
   # Resetar volume
   docker-compose down -v
   docker-compose up -d mysql
   ```

3. **Backend não conecta ao MySQL**
   ```bash
   # Aguardar MySQL ficar pronto
   make db-check
   
   # Reiniciar backend
   docker-compose restart backend
   ```

4. **Frontend não carrega**
   ```bash
   # Verificar se backend está rodando
   curl http://localhost:8080/api/health
   
   # Verificar logs do frontend
   docker-compose logs frontend
   ```

### Logs Úteis
```bash
# Todos os logs
make logs

# Apenas backend
make logs-backend

# Apenas MySQL
make logs-mysql

# Seguir logs em tempo real
docker-compose logs -f backend
```

## 📈 Monitoramento

### Health Checks Automáticos
- **MySQL**: `mysqladmin ping`
- **Backend**: `curl /api/health`
- **Docker**: Health checks configurados

### Métricas Disponíveis
```bash
# Estatísticas do banco
make db-stats

# Status dos containers
docker-compose ps

# Uso de recursos
docker stats
```

## 🎉 Funcionalidades Demonstradas

### 1. **Server-Sent Events**
- Notificações em tempo real
- Reconexão automática
- Múltiplos tipos de evento

### 2. **Internacionalização**
- 4 idiomas suportados
- Interceptor automático
- Mensagens contextuais

### 3. **Containerização**
- Multi-stage builds
- Health checks
- Volumes persistentes

### 4. **Banco de Dados**
- Migrations automáticas
- Dados iniciais ricos
- Backup/restore

### 5. **Desenvolvimento**
- Scripts automatizados
- Múltiplos ambientes
- Hot reload

## 🚀 Próximos Passos

### Melhorias Possíveis
1. **Autenticação**: JWT + Spring Security
2. **Cache**: Redis para performance
3. **Monitoramento**: Prometheus + Grafana
4. **Testes**: Cobertura completa
5. **CI/CD**: Pipeline automatizado

### Deploy em Produção
1. **Configurar variáveis de ambiente**
2. **Usar secrets para senhas**
3. **Configurar SSL/TLS**
4. **Implementar load balancer**
5. **Configurar backup automático**

## 📞 Suporte

### Comandos de Ajuda
```bash
# Makefile
make help

# Scripts
./scripts/build-and-run.sh help
./scripts/database-manager.sh help
```

### Informações do Sistema
```bash
# Informações completas
make info

# Status detalhado
make status

# Health check completo
make health
```

---

**🎯 A aplicação está completa e pronta para uso!**

Execute `make docker` e acesse http://localhost:4200 para começar! 🚀✨