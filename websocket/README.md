# WebSocket Demo - Comunicação Bidirecional em Tempo Real

Este projeto é uma versão convertida do projeto "server-sent-events" que utiliza **WebSockets** ao invés de **Server-Sent Events (SSE)** para comunicação em tempo real entre backend e frontend.

## 🔄 Principais Mudanças

### Backend (Spring Boot)

#### Dependências Adicionadas
- `spring-boot-starter-websocket` - Suporte nativo ao WebSocket
- Configuração STOMP para mensagens estruturadas

#### Novos Componentes

1. **WebSocketConfig** - Configuração principal do WebSocket
   - Endpoint: `/ws` (com SockJS fallback)
   - Endpoint nativo: `/ws-native`
   - Autenticação JWT via query parameter ou header
   - Prefixos: `/topic` (broadcast), `/queue` (individual), `/app` (cliente→servidor)

2. **WebSocketNotificationService** - Substitui o SSENotificationService
   - Gerenciamento de conexões por usuário
   - Envio de notificações individuais e broadcast
   - Controle de sessões WebSocket

3. **WebSocketController** - Substitui o SSEController
   - Manipulação de conexões/desconexões
   - Endpoints REST para testes e status
   - Suporte a ping/keepalive

#### Serviços Atualizados
- **ExternalDataService** - Usa WebSocketNotificationService
- **ExternalMessageService** - Usa WebSocketNotificationService  
- **UserMessageService** - Usa WebSocketNotificationService

### Frontend (Angular)

#### Dependências Adicionadas
- `@stomp/stompjs` - Cliente STOMP para WebSocket
- `sockjs-client` - Fallback para navegadores antigos
- `@types/sockjs-client` - Tipos TypeScript

#### Novos Componentes

1. **WebSocketService** - Substitui o SSEService
   - Cliente STOMP configurado
   - Reconexão automática
   - Subscriptions para diferentes tipos de mensagem
   - Autenticação JWT integrada

#### Componentes Atualizados
- **DashboardComponent** - Usa WebSocketService
- **MessageListComponent** - Usa WebSocketService
- **NotificationService** - Endpoints atualizados

## 🚀 Como Executar

### Pré-requisitos
- Java 21+
- Node.js 18+
- MySQL 8.0+
- Maven 3.8+

### Backend
```bash
cd websocket/backend
mvn spring-boot:run
```

### Frontend
```bash
cd websocket/frontend
npm install
npm start
```

### Banco de Dados
```bash
cd websocket
docker-compose up mysql
```

## 🔧 Configuração

### Banco de Dados
- **Nome**: `websocket_demo`
- **Usuário**: `websocket_user`
- **Senha**: `websocket_password`
- **Porta**: `3306`

### Endpoints WebSocket
- **Conexão**: `ws://localhost:8080/ws`
- **Conexão Nativa**: `ws://localhost:8080/ws-native`

### Endpoints REST
- **Status**: `GET /api/notifications/status`
- **Teste**: `POST /api/notifications/test`
- **Busca Externa**: `POST /api/notifications/force-fetch`

## 📡 Fluxo de Comunicação

### Conexão
1. Cliente conecta em `/ws?token=JWT_TOKEN`
2. Handshake valida JWT e extrai informações do usuário
3. Cliente envia mensagem para `/app/connect`
4. Servidor registra usuário e envia mensagem de boas-vindas

### Notificações
- **Broadcast**: `/topic/{eventName}` - Todos os usuários
- **Individual**: `/user/queue/{eventName}` - Usuário específico
- **Tipos**: `dataUpdate`, `error`, `info`, `newMessage`, `connection`

### Desconexão
1. Cliente envia mensagem para `/app/disconnect`
2. Servidor remove usuário do registro
3. Conexão é fechada

## 🔐 Autenticação

### JWT Token
- Enviado via query parameter: `?token=JWT_TOKEN`
- Ou via header: `Authorization: Bearer JWT_TOKEN`
- Validado durante handshake
- Informações extraídas: `userId`, `username`, `userRole`

### Controle de Acesso
- Usuários só recebem suas próprias mensagens individuais
- ADMIN pode enviar notificações para usuários específicos
- Broadcast disponível para todos os usuários conectados

## 🆚 WebSocket vs SSE

### Vantagens do WebSocket
- ✅ Comunicação bidirecional
- ✅ Menor overhead de protocolo
- ✅ Suporte nativo a mensagens estruturadas
- ✅ Melhor controle de conexão
- ✅ Ping/Pong automático

### Desvantagens
- ❌ Mais complexo de implementar
- ❌ Requer fallback para navegadores antigos
- ❌ Maior consumo de recursos no servidor

## 🧪 Testes

### Usuários de Teste
- **admin/admin123** - Administrador
- **editor/editor123** - Editor  
- **viewer/viewer123** - Visualizador

### Cenários de Teste
1. **Conexão Múltipla**: Abrir várias abas com usuários diferentes
2. **Notificações Broadcast**: Usar endpoint de teste
3. **Mensagens Individuais**: Sistema de mensagens externas
4. **Reconexão**: Desconectar/reconectar WebSocket
5. **Autenticação**: Testar com tokens inválidos

## 📊 Monitoramento

### Logs
- Conexões/desconexões WebSocket
- Envio de notificações
- Erros de autenticação
- Status das sessões

### Métricas
- Usuários conectados
- Conexões ativas por usuário
- Mensagens enviadas/recebidas
- Tempo de conexão

## 🔧 Troubleshooting

### Problemas Comuns

1. **Conexão Falha**
   - Verificar se JWT é válido
   - Confirmar se servidor está rodando
   - Checar logs de autenticação

2. **Mensagens Não Chegam**
   - Verificar subscriptions no cliente
   - Confirmar se usuário está conectado
   - Checar logs do servidor

3. **Reconexão Não Funciona**
   - Verificar se token ainda é válido
   - Confirmar configuração de reconexão
   - Checar se AuthService está funcionando

### Debug
```javascript
// No console do navegador
webSocketService.getDebugInfo()
```

## 📝 Próximos Passos

- [ ] Implementar heartbeat customizado
- [ ] Adicionar métricas detalhadas
- [ ] Suporte a salas/grupos
- [ ] Compressão de mensagens
- [ ] Rate limiting
- [ ] Clustering/Load balancing

## 🤝 Contribuição

Este projeto mantém a mesma funcionalidade do projeto SSE original, apenas substituindo o mecanismo de comunicação. Todas as features de autenticação, autorização, internacionalização e gerenciamento de dados permanecem inalteradas.