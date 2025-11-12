# 🚀 WebSocket Demo

Aplicação demonstrativa de comunicação bidirecional entre Angular 18 e Spring Boot 3 usando WebSocket com STOMP.

## 📋 Funcionalidades

- ✅ **Comunicação REST**: Frontend faz requisições HTTP para o backend
- ✅ **WebSocket Bidirecional**: Comunicação em tempo real nos dois sentidos
- ✅ **STOMP Protocol**: Protocolo de mensagens sobre WebSocket
- ✅ **Dados Externos**: Simulação de importação automática de dados externos
- ✅ **Interface Responsiva**: Dashboard moderno com Bootstrap
- ✅ **Monitoramento**: Status de conexão WebSocket em tempo real
- ✅ **Testes**: Ferramentas de diagnóstico e teste de conectividade
- ✅ **Documentação API**: Swagger/OpenAPI 3 integrado

## 🏗️ Arquitetura

```
┌─────────────────┐    HTTP REST    ┌─────────────────┐
│                 │ ──────────────> │                 │
│  Angular 18     │                 │  Spring Boot 3  │
│  (Frontend)     │ <────────────── │  (Backend)      │
│                 │    WebSocket    │                 │
│  @stomp/stompjs │ <──────────────> │ Spring WebSocket│
└─────────────────┘     STOMP       └─────────────────┘
```

## 🛠️ Tecnologias

### Backend
- **Java 21**
- **Spring Boot 3.2.0**
- **Spring WebSocket** (STOMP)
- **Spring Web** (para REST)
- **Spring Data JPA**
- **H2 Database** (em memória)
- **Jackson** (serialização JSON)
- **SpringDoc OpenAPI 3** (Swagger)

### Frontend
- **Angular 18**
- **TypeScript**
- **RxJS** (programação reativa)
- **@stomp/stompjs** (cliente WebSocket STOMP)
- **SockJS** (fallback para WebSocket)
- **Bootstrap 5** (UI)

## 🚀 Como Executar

### Pré-requisitos
- Java 21+
- Node.js 18+
- Maven 3.6+
- Angular CLI 18+

### 1. Backend (Spring Boot)

```bash
cd websocket/backend
mvn clean install
mvn spring-boot:run
```

O servidor estará disponível em: `http://localhost:8080`

### 2. Frontend (Angular)

```bash
cd websocket/frontend
npm install
ng serve
```

A aplicação estará disponível em: `http://localhost:4200`

## 📚 Documentação da API

### Swagger UI
Acesse a documentação interativa da API em: `http://localhost:8080/swagger-ui.html`

### OpenAPI JSON
Especificação OpenAPI 3 disponível em: `http://localhost:8080/api-docs`

## 📡 Endpoints e Comunicação

### REST Endpoints
- `GET /api/health` - Status do servidor
- `GET /api/data` - Listar todos os dados
- `POST /api/data` - Criar novo registro
- `PUT /api/data/{id}` - Atualizar registro
- `DELETE /api/data/{id}` - Excluir registro
- `GET /api/data/external` - Dados externos
- `GET /api/data/internal` - Dados internos
- `GET /api/data/stats` - Estatísticas

### WebSocket Endpoints
- **Conexão**: `ws://localhost:8080/ws` (com SockJS)
- **Conexão Nativa**: `ws://localhost:8080/ws-native`

### STOMP Destinations

#### Subscrições (Cliente → Servidor)
- `/topic/notifications` - Receber notificações gerais
- `/user/queue/private` - Mensagens privadas do usuário

#### Publicações (Cliente → Servidor)
- `/app/test` - Enviar mensagem de teste
- `/app/force-fetch` - Forçar busca de dados externos
- `/app/ping` - Teste de conectividade

### WebSocket REST API
- `POST /api/websocket/test` - Enviar notificação via REST
- `POST /api/websocket/force-fetch` - Buscar dados via REST
- `GET /api/websocket/status` - Status das conexões WebSocket

## 🔍 Testes e Diagnóstico

### 1. Swagger UI
Use a interface do Swagger em `http://localhost:8080/swagger-ui.html` para testar todos os endpoints REST.

### 2. Teste Manual WebSocket
Abra o arquivo `frontend/test-websocket.html` no navegador para testar diretamente a conexão WebSocket.

### 3. Comandos de Teste

```bash
# Testar servidor
curl http://localhost:8080/api/health

# Testar status WebSocket
curl http://localhost:8080/api/websocket/status

# Enviar notificação via REST
curl -X POST http://localhost:8080/api/websocket/test \
  -H "Content-Type: application/json" \
  -d '{"message":"Teste via REST"}'

# Criar novo registro (gera notificação WebSocket)
curl -X POST http://localhost:8080/api/data \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste WebSocket","value":"Valor teste"}'
```

### 4. Console do Navegador
Abra o DevTools (F12) e monitore:
- **Console**: Logs de conexão WebSocket e STOMP
- **Network**: Requisições HTTP e upgrade para WebSocket
- **Application**: WebSocket connections

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

logging:
  level:
    org.springframework.messaging: DEBUG
```

### Frontend (WebSocket Service)
```typescript
const stompConfig: StompConfig = {
  brokerURL: 'ws://localhost:8080/ws',
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000,
  reconnectDelay: 0
};
```

## 📊 Funcionalidades Implementadas

### 1. Comunicação REST
- ✅ CRUD completo de dados
- ✅ Validação de entrada
- ✅ Tratamento de erros
- ✅ Configuração CORS
- ✅ Documentação Swagger

### 2. WebSocket Bidirecional
- ✅ Conexão automática com STOMP
- ✅ Reconexão automática
- ✅ Subscrições a tópicos
- ✅ Envio de mensagens
- ✅ Heartbeat para manter conexão
- ✅ Fallback com SockJS

### 3. Interface do Usuário
- ✅ Dashboard responsivo
- ✅ Notificações em tempo real
- ✅ Indicador de status WebSocket
- ✅ Ferramentas de debug
- ✅ Testes de conectividade

### 4. Dados Externos
- ✅ Importação automática (30s)
- ✅ Busca manual via WebSocket
- ✅ Busca manual via REST
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
- **WebSocket Endpoint**: ws://localhost:8080/ws
- **Teste WebSocket**: Abrir `test-websocket.html`

## 🔄 Diferenças do SSE

### Vantagens do WebSocket sobre SSE:
1. **Comunicação Bidirecional**: Cliente pode enviar mensagens para o servidor
2. **Protocolo Otimizado**: Menos overhead que HTTP
3. **STOMP Protocol**: Estrutura de mensagens mais robusta
4. **Múltiplos Canais**: Subscrições a diferentes tópicos
5. **Heartbeat**: Detecção automática de conexões perdidas

### Casos de Uso WebSocket:
- Chat em tempo real
- Jogos multiplayer
- Colaboração em tempo real
- Trading/Bolsa de valores
- Monitoramento em tempo real

## 🐛 Solução de Problemas

### Problema: WebSocket não conecta
**Solução:**
1. Verificar se o backend está rodando
2. Verificar configuração CORS
3. Verificar firewall/antivírus
4. Usar o arquivo `test-websocket.html` para diagnóstico
5. Verificar logs STOMP no console

### Problema: Mensagens não chegam
**Solução:**
1. Verificar subscrição ao tópico correto
2. Confirmar formato da mensagem
3. Verificar logs do servidor
4. Testar com Swagger UI

### Problema: Reconexão não funciona
**Solução:**
1. Verificar configuração de heartbeat
2. Ajustar delay de reconexão
3. Verificar limpeza de recursos

## 📝 Logs Importantes

### Backend
```
INFO: WebSocket connection established
INFO: STOMP CONNECT frame received
INFO: Sending WebSocket notification to all clients: DATA_UPDATE
```

### Frontend
```
🔄 Tentando conectar ao WebSocket: ws://localhost:8080/ws
✅ WebSocket conectado com sucesso!
📡 Subscrito ao tópico /topic/notifications
📨 Mensagem WebSocket recebida: {"type":"CONNECTION","message":"Conectado..."}
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.