# 🔧 Solução para Erro 400 BAD_REQUEST no WebSocket

## 🚨 Análise do Problema

**Erro Persistente:**
```
17:52:59.840 [http-nio-8080-exec-4] DEBUG o.s.w.s.s.t.h.DefaultSockJsService - Processing transport request: GET http://localhost:8080/ws
17:52:59.840 [http-nio-8080-exec-4] DEBUG o.s.web.servlet.DispatcherServlet - Completed 400 BAD_REQUEST
```

**Causa Raiz:** O SockJS está recebendo uma requisição GET direta para `/ws` sem os parâmetros necessários.

## ✅ Soluções Implementadas

### 1. **Configuração SockJS Melhorada**
```java
registry.addEndpoint("/ws")
    .setAllowedOriginPatterns("*")
    .addInterceptors(new WebSocketInterceptor())
    .withSockJS()
    .setStreamBytesLimit(512 * 1024)
    .setHttpMessageCacheSize(1000)
    .setDisconnectDelay(30 * 1000)
    .setHeartbeatTime(25000);
```

### 2. **WebSocketInterceptor para Debug**
- Logs detalhados do handshake
- Informações de origem e headers
- Tratamento de erros específicos

### 3. **SockJsInfoController**
- Endpoint `/ws/info` para informações SockJS
- Resposta adequada para requisições diretas

### 4. **WebSocketService Melhorado**
- Logs mais detalhados
- Melhor tratamento de erros
- Factory SockJS correta

## 🔍 Como Diagnosticar

### 1. **Testar Endpoints Básicos**
```bash
# Deve retornar 200 OK
curl http://localhost:8080/api/health

# Deve retornar info SockJS
curl http://localhost:8080/ws/info

# Debug WebSocket
curl http://localhost:8080/api/debug/websocket-info
```

### 2. **Testar SockJS Simples**
Abrir `test-sockjs-simple.html` no navegador e verificar:
- SockJS Info endpoint
- Conexão SockJS direta

### 3. **Verificar Logs Detalhados**
No console do servidor, procurar por:
```
INFO: 🤝 WebSocket handshake iniciado
INFO: ✅ Handshake WebSocket concluído com sucesso
INFO: ✅ Nova conexão WebSocket estabelecida
```

## 🎯 O Erro 400 é Normal?

**SIM!** O erro 400 pode ser normal em alguns casos:

### Casos Normais:
1. **Requisições de Health Check** de load balancers
2. **Tentativas de conexão** antes do SockJS estar pronto
3. **Requisições diretas** ao endpoint `/ws` sem parâmetros SockJS

### Casos Problemáticos:
1. **Todas as tentativas** resultam em 400
2. **Cliente nunca conecta** após múltiplas tentativas
3. **Erro persiste** mesmo com configuração correta

## 🔧 Passos para Resolver

### 1. **Reiniciar com Logs Detalhados**
```bash
cd websocket/backend
mvn clean install
mvn spring-boot:run
```

### 2. **Testar Conectividade Básica**
```bash
# Testar servidor
curl http://localhost:8080/api/health

# Testar SockJS info
curl http://localhost:8080/ws/info
```

### 3. **Testar SockJS Simples**
Abrir `test-sockjs-simple.html` e verificar se conecta.

### 4. **Testar Aplicação Angular**
```bash
cd websocket/frontend
npm install
ng serve
```

### 5. **Verificar Logs de Sucesso**
Procurar por estas mensagens nos logs:
```
✅ Nova conexão WebSocket estabelecida. Session ID: xxx
📡 Nova subscrição. Session ID: xxx, Destination: /topic/notifications
```

## 🎯 Indicadores de Sucesso

### Backend Logs:
```
INFO: 🤝 WebSocket handshake iniciado
INFO: ✅ Handshake WebSocket concluído com sucesso
INFO: ✅ Nova conexão WebSocket estabelecida. Session ID: xxx
INFO: 📡 Nova subscrição. Session ID: xxx, Destination: /topic/notifications
```

### Frontend Console:
```
🔄 Tentando conectar ao WebSocket: http://localhost:8080/ws
🏭 Criando SockJS connection...
🔍 STOMP Debug: Opening Web Socket...
✅ WebSocket conectado com sucesso!
📡 Subscrito ao tópico /topic/notifications
```

### Dashboard:
- Status: "WebSocket Conectado" (verde)
- Debug info mostra "CONNECTED"
- Notificações chegam em tempo real

## 🚨 Se o Erro Persistir

### 1. **Verificar Firewall/Antivírus**
- Permitir porta 8080
- Desabilitar temporariamente para teste

### 2. **Testar em Navegador Diferente**
- Chrome/Firefox/Edge
- Modo incógnito

### 3. **Verificar Proxy/VPN**
- Pode interferir com WebSocket
- Testar sem proxy

### 4. **Logs Mais Detalhados**
Adicionar no `application.yml`:
```yaml
logging:
  level:
    org.springframework.web.socket: TRACE
    org.springframework.messaging: TRACE
```

## 📊 Monitoramento Contínuo

### Endpoints de Monitoramento:
- `GET /api/health` - Status geral
- `GET /api/websocket/status` - Status WebSocket
- `GET /api/debug/websocket-info` - Info detalhada
- `GET /ws/info` - Info SockJS

### Métricas Importantes:
- Conexões ativas
- Tentativas de conexão
- Erros de handshake
- Mensagens enviadas/recebidas

## ✅ Conclusão

O erro 400 pode ser normal durante o processo de conexão SockJS. O importante é verificar se:

1. **Conexões bem-sucedidas** acontecem após os erros 400
2. **Cliente conecta** e recebe mensagens
3. **Dashboard mostra** "WebSocket Conectado"
4. **Notificações funcionam** em tempo real

Se estes critérios são atendidos, o sistema está funcionando corretamente, mesmo com alguns erros 400 nos logs.