# 🚀 Server-Sent Events Demo

Aplicação demonstrativa de comunicação bidirecional entre Angular 18 e Spring Boot 3 usando Server-Sent Events (SSE).

## 📋 Funcionalidades

- ✅ **Comunicação REST**: Frontend faz requisições HTTP para o backend
- ✅ **Server-Sent Events**: Backend envia notificações em tempo real para o frontend
- ✅ **Dados Externos**: Simulação de importação automática de dados externos
- ✅ **Interface Responsiva**: Dashboard moderno com Bootstrap
- ✅ **Monitoramento**: Status de conexão SSE em tempo real
- ✅ **Testes**: Ferramentas de diagnóstico e teste de conectividade
- ✅ **Documentação API**: Swagger/OpenAPI 3 integrado

## 🏗️ Arquitetura

```
┌─────────────────┐    HTTP REST    ┌─────────────────┐
│                 │ ──────────────> │                 │
│  Angular 18     │                 │  Spring Boot 3  │
│  (Frontend)     │ <────────────── │  (Backend)      │
│                 │   Server-Sent   │                 │
└─────────────────┘     Events      └─────────────────┘
```

## 🛠️ Tecnologias

### Backend
- **Java 21**
- **Spring Boot 3.2.0**
- **Spring Web** (para REST e SSE)
- **Spring Data JPA**
- **H2 Database** (em memória)
- **Jackson** (serialização JSON)
- **SpringDoc OpenAPI 3** (Swagger)

### Frontend
- **Angular 18**
- **TypeScript**
- **RxJS** (programação reativa)
- **Bootstrap 5** (UI)
- **EventSource API** (SSE)

## 🚀 Como Executar

### Pré-requisitos
- Java 21+
- Node.js 18+
- Maven 3.6+
- Angular CLI 18+

### 1. Backend (Spring Boot)

```bash
cd server-sent-events/backend
mvn clean install
mvn spring-boot:run
```

O servidor estará disponível em: `http://localhost:8080`

### 2. Frontend (Angular)

```bash
cd server-sent-events/frontend
npm install
ng serve
```

A aplicação estará disponível em: `http://localhost:4200`

## 📚 Documentação da API

### Swagger UI
Acesse a documentação interativa da API em: `http://localhost:8080/swagger-ui.html`

### OpenAPI JSON
Especificação OpenAPI 3 disponível em: `http://localhost:8080/api-docs`

### Principais Recursos do Swagger:
- ✅ **Documentação completa** de todos os endpoints
- ✅ **Exemplos de requisições** e respostas
- ✅ **Interface interativa** para testar APIs
- ✅ **Modelos de dados** documentados
- ✅ **Códigos de resposta** detalhados

## 📡 Endpoints da API

### Health Check
- `GET /api/health` - Status do servidor

### Data Management
- `GET /api/data` - Listar todos os dados
- `POST /api/data` - Criar novo registro
- `PUT /api/data/{id}` - Atualizar registro
- `DELETE /api/data/{id}` - Excluir registro
- `GET /api/data/external` - Dados externos
- `GET /api/data/internal` - Dados internos
- `GET /api/data/stats` - Estatísticas

### Server-Sent Events
- `GET /api/notifications/stream` - Stream de notificações SSE
- `POST /api/notifications/test` - Enviar notificação de teste
- `POST /api/notifications/force-fetch` - Forçar busca de dados externos
- `GET /api/notifications/status` - Status das conexões SSE

## 🔍 Testes e Diagnóstico

### 1. Swagger UI
Use a interface do Swagger em `http://localhost:8080/swagger-ui.html` para testar todos os endpoints interativamente.

### 2. Teste Manual SSE
Abra o arquivo `frontend/test-sse.html` no navegador para testar diretamente a conexão SSE.

### 3. Comandos de Teste

```bash
# Testar servidor
curl http://localhost:8080/api/health

# Testar endpoint SSE
curl -H "Accept: text/event-stream" http://localhost:8080/api/notifications/stream

# Testar CORS
curl -X OPTIONS -H "Origin: http://localhost:4200" http://localhost:8080/api/notifications/stream

# Criar novo registro via API
curl -X POST http://localhost:8080/api/data \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste API","value":"Valor teste"}'
```

### 4. Console do Navegador
Abra o DevTools (F12) e monitore:
- **Console**: Logs de conexão SSE
- **Network**: Requisições HTTP e SSE
- **Application**: EventSource connections

## 🔧 Configurações

### Backend (application.yml)
```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:h2:mem:testdb
  
  jackson:
    serialization:
      write-dates-as-timestamps: false

# SpringDoc OpenAPI 3 Configuration
springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html
    try-it-out-enabled: true
```

### Frontend (environment)
```typescript
export const environment = {
  apiUrl: 'http://localhost:8080/api',
  sseUrl: 'http://localhost:8080/api/notifications/stream'
};
```

## 📊 Funcionalidades Implementadas

### 1. Comunicação REST
- ✅ CRUD completo de dados
- ✅ Validação de entrada
- ✅ Tratamento de erros
- ✅ Configuração CORS
- ✅ Documentação Swagger

### 2. Server-Sent Events
- ✅ Conexão automática
- ✅ Reconexão automática
- ✅ Múltiplos tipos de eventos
- ✅ Tratamento de erros
- ✅ Status de conexão

### 3. Interface do Usuário
- ✅ Dashboard responsivo
- ✅ Notificações em tempo real
- ✅ Indicador de status SSE
- ✅ Ferramentas de debug

### 4. Dados Externos
- ✅ Importação automática (30s)
- ✅ Busca manual
- ✅ Notificações de atualização
- ✅ Diferenciação visual

### 5. Documentação
- ✅ Swagger UI integrado
- ✅ OpenAPI 3 specification
- ✅ Exemplos de uso
- ✅ Modelos documentados

## 🌐 URLs Importantes

- **Frontend Angular**: http://localhost:4200
- **Backend Spring Boot**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI Docs**: http://localhost:8080/api-docs
- **H2 Console**: http://localhost:8080/h2-console
- **Health Check**: http://localhost:8080/api/health
- **SSE Stream**: http://localhost:8080/api/notifications/stream

## 🐛 Solução de Problemas

### Problema: SSE não conecta
**Solução:**
1. Verificar se o backend está rodando
2. Verificar configuração CORS
3. Verificar firewall/antivírus
4. Usar o arquivo `test-sse.html` para diagnóstico
5. Testar via Swagger UI

### Problema: CORS bloqueado
**Solução:**
1. Verificar configuração no `CorsConfig.java`
2. Confirmar origem `http://localhost:4200`
3. Verificar headers permitidos

### Problema: Dados não atualizam
**Solução:**
1. Verificar logs do backend
2. Confirmar conexão SSE ativa
3. Testar endpoint de notificação manual via Swagger

## 📝 Logs Importantes

### Backend
```
INFO: New SSE connection established. Total connections: 1
INFO: Sending notification to 1 connections: DATA_UPDATE
INFO: Notification sent. Active connections: 1
```

### Frontend
```
🔄 Tentando conectar ao SSE: http://localhost:8080/api/notifications/stream
✅ SSE conectado com sucesso!
📨 Mensagem SSE recebida: {"type":"CONNECTION","message":"Conectado..."}
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.