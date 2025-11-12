# 🔍 Diagnóstico de Problemas SSE

## Checklist de Verificação

### 1. ✅ Servidor Spring Boot
- [ ] O servidor está rodando na porta 8080?
- [ ] O endpoint `/api/health` responde?
- [ ] O endpoint `/api/notifications/stream` existe?
- [ ] CORS está configurado corretamente?

**Como verificar:**
```bash
# Teste básico do servidor
curl http://localhost:8080/api/health

# Teste do endpoint SSE
curl -H "Accept: text/event-stream" http://localhost:8080/api/notifications/stream
```

### 2. ✅ Configuração CORS
Verifique se o servidor Spring Boot tem CORS configurado para:
- Origin: `http://localhost:4200`
- Headers: `Accept, Content-Type, Cache-Control`
- Methods: `GET, POST, OPTIONS`

### 3. ✅ Teste Manual SSE
Abra o arquivo `test-sse.html` no navegador para testar diretamente.

### 4. ✅ Console do Navegador
Abra o DevTools (F12) e verifique:
- [ ] Erros de CORS na aba Console
- [ ] Requisições na aba Network
- [ ] Status da conexão SSE

### 5. ✅ Logs do Angular
No console do navegador, procure por:
- `🔄 Tentando conectar ao SSE`
- `✅ SSE conectado com sucesso`
- `❌ Erro na conexão SSE`

## Possíveis Problemas e Soluções

### Problema 1: Servidor não está rodando
**Sintoma:** `ERR_CONNECTION_REFUSED`
**Solução:** Inicie o servidor Spring Boot

### Problema 2: CORS bloqueado
**Sintoma:** `CORS policy: No 'Access-Control-Allow-Origin' header`
**Solução:** Configurar CORS no Spring Boot:

```java
@CrossOrigin(origins = "http://localhost:4200")
@RestController
public class NotificationController {
    // ...
}
```

### Problema 3: Endpoint SSE não existe
**Sintoma:** `404 Not Found`
**Solução:** Verificar se o controller SSE está implementado

### Problema 4: EventSource não conecta
**Sintoma:** `ReadyState: CLOSED (2)`
**Solução:** Verificar URL e headers

### Problema 5: Firewall/Antivírus
**Sintoma:** Timeout na conexão
**Solução:** Verificar configurações de firewall

## Comandos de Teste

### Teste 1: Servidor básico
```bash
curl -v http://localhost:8080/api/health
```

### Teste 2: Endpoint SSE
```bash
curl -v -H "Accept: text/event-stream" -H "Cache-Control: no-cache" http://localhost:8080/api/notifications/stream
```

### Teste 3: CORS Preflight
```bash
curl -v -X OPTIONS -H "Origin: http://localhost:4200" -H "Access-Control-Request-Method: GET" http://localhost:8080/api/notifications/stream
```

## Logs Esperados

### No Angular (Console do Navegador):
```
🚀 Inicializando Dashboard...
🔍 Executando teste de conectividade...
📡 EventSource criado, aguardando conexão...
✅ SSE conectado com sucesso!
📊 Status da conexão SSE: ✅ Conectado
```

### No Spring Boot (Console do Servidor):
```
INFO: New SSE connection established
INFO: Client connected to notifications stream
```

## Próximos Passos

1. **Execute o teste manual:** Abra `test-sse.html` no navegador
2. **Verifique os logs:** Console do navegador e servidor
3. **Teste os endpoints:** Use curl ou Postman
4. **Verifique CORS:** Especialmente importante para SSE
5. **Analise a rede:** DevTools > Network para ver requisições

## URLs de Teste

- **Frontend Angular:** http://localhost:4200
- **Servidor Spring Boot:** http://localhost:8080
- **Health Check:** http://localhost:8080/api/health
- **SSE Endpoint:** http://localhost:8080/api/notifications/stream
- **Teste Manual:** Abrir `test-sse.html` no navegador