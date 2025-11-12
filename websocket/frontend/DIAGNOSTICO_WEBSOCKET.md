# 🔍 Diagnóstico de Problemas WebSocket

## Checklist de Verificação

### 1. ✅ Servidor Spring Boot
- [ ] O servidor está rodando na porta 8080?
- [ ] O endpoint `/api/health` responde?
- [ ] O endpoint `/api/websocket/status` existe?
- [ ] CORS está configurado corretamente?
- [ ] Logs do WebSocket estão habilitados?

**Como verificar:**
```bash
# Teste básico do servidor
curl http://localhost:8080/api/health

# Teste do status WebSocket
curl http://localhost:8080/api/websocket/status

# Teste de debug
curl http://localhost:8080/api/debug/websocket-info
```

### 2. ✅ Configuração WebSocket
Verifique se o servidor Spring Boot tem WebSocket configurado para:
- Endpoint: `/ws` (com SockJS)
- Origin: `*` ou `http://localhost:4200`
- Broker: `/topic`, `/queue`
- App prefix: `/app`

### 3. ✅ Teste Manual WebSocket
Abra o arquivo `test-websocket.html` no navegador para testar diretamente.

### 4. ✅ Console do Navegador
Abra o DevTools (F12) e verifique:
- [ ] Erros de CORS na aba Console
- [ ] Requisições na aba Network
- [ ] Upgrade para WebSocket
- [ ] Mensagens STOMP

### 5. ✅ Logs do Angular
No console do navegador, procure por:
- `🔄 Tentando conectar ao WebSocket`
- `✅ WebSocket conectado com sucesso`
- `❌ Erro STOMP` ou `❌ Erro WebSocket`

## Possíveis Problemas e Soluções

### Problema 1: Servidor não está rodando
**Sintoma:** `ERR_CONNECTION_REFUSED`
**Solução:** Inicie o servidor Spring Boot

### Problema 2: CORS bloqueado
**Sintoma:** `CORS policy: No 'Access-Control-Allow-Origin' header`
**Solução:** Verificar configuração CORS no WebSocketConfig

### Problema 3: SockJS não funciona
**Sintoma:** `400 BAD_REQUEST` no endpoint `/ws`
**Solução:** 
- Usar `http://localhost:8080/ws` (não `ws://`)
- Configurar SockJS corretamente
- Verificar `setAllowedOriginPatterns("*")`

### Problema 4: STOMP não conecta
**Sintoma:** `Erro STOMP` no console
**Solução:** 
- Verificar configuração do broker
- Verificar prefixos de destino
- Verificar heartbeat

### Problema 5: Mensagens não chegam
**Sintoma:** Conexão OK mas sem mensagens
**Solução:** 
- Verificar subscrição ao tópico correto
- Verificar formato da mensagem
- Verificar logs do servidor

## Comandos de Teste

### Teste 1: Servidor básico
```bash
curl -v http://localhost:8080/api/health
```

### Teste 2: Status WebSocket
```bash
curl -v http://localhost:8080/api/websocket/status
```

### Teste 3: Debug WebSocket
```bash
curl -v http://localhost:8080/api/debug/websocket-info
```

### Teste 4: Enviar mensagem via REST
```bash
curl -X POST http://localhost:8080/api/debug/send-test
```

### Teste 5: Endpoint SockJS
```bash
curl -v http://localhost:8080/ws/info
```

## Logs Esperados

### No Angular (Console do Navegador):
```
🚀 Inicializando Dashboard WebSocket...
🔄 Tentando conectar ao WebSocket: http://localhost:8080/ws
🔍 STOMP Debug: Opening Web Socket...
🔍 STOMP Debug: Web Socket Opened...
✅ WebSocket conectado com sucesso!
📡 Subscrito ao tópico /topic/notifications
```

### No Spring Boot (Console do Servidor):
```
DEBUG: Processing transport request: GET http://localhost:8080/ws
INFO: ✅ Nova conexão WebSocket estabelecida. Session ID: xxx
INFO: 📡 Nova subscrição. Session ID: xxx, Destination: /topic/notifications
```

## Estrutura de Mensagens

### Mensagem STOMP de Conexão:
```
CONNECT
accept-version:1.0,1.1,1.2
heart-beat:4000,4000
```

### Mensagem STOMP de Subscrição:
```
SUBSCRIBE
id:sub-0
destination:/topic/notifications
```

### Mensagem STOMP de Envio:
```
SEND
destination:/app/test
content-type:application/json

{"message":"Teste"}
```

## Próximos Passos

1. **Execute o teste manual:** Abra `test-websocket.html` no navegador
2. **Verifique os logs:** Console do navegador e servidor
3. **Teste os endpoints:** Use curl ou Postman
4. **Verifique CORS:** Especialmente importante para WebSocket
5. **Analise a rede:** DevTools > Network para ver upgrade para WebSocket
6. **Teste SockJS:** Verificar se fallback funciona

## URLs de Teste

- **Frontend Angular:** http://localhost:4200
- **Servidor Spring Boot:** http://localhost:8080
- **Health Check:** http://localhost:8080/api/health
- **WebSocket Status:** http://localhost:8080/api/websocket/status
- **WebSocket Debug:** http://localhost:8080/api/debug/websocket-info
- **SockJS Info:** http://localhost:8080/ws/info
- **Swagger UI:** http://localhost:8080/swagger-ui.html
- **Teste Manual:** Abrir `test-websocket.html` no navegador

## Diferenças do SSE

### WebSocket vs SSE:
- **WebSocket:** Protocolo próprio, bidirecional, mais complexo
- **SSE:** HTTP, unidirecional, mais simples

### Configuração WebSocket:
- Requer `@EnableWebSocketMessageBroker`
- Configuração de endpoints STOMP
- SockJS como fallback
- Gerenciamento de sessões

### Debug WebSocket:
- Logs STOMP mais verbosos
- Estados de conexão mais complexos
- Heartbeat e reconexão manual
- Múltiplos tipos de erro (WebSocket + STOMP)