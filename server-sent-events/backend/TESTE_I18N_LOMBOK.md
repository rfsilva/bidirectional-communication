# Guia de Testes - Lombok e I18N

Este guia fornece exemplos práticos para testar as funcionalidades de Lombok e Internacionalização implementadas.

## 🧪 Testando Lombok

### 1. Verificar Geração Automática de Métodos

**Teste com DataEntity:**
```bash
# Criar um novo registro via API
curl -X POST http://localhost:8080/api/data \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Lombok",
    "value": "Verificando getters/setters automáticos"
  }'
```

**Verificação:**
- ✅ Métodos `getName()`, `setName()` funcionam automaticamente
- ✅ `toString()` retorna representação legível
- ✅ `equals()` e `hashCode()` implementados corretamente

### 2. Verificar Logs com @Slf4j

**Observar logs no console:**
```bash
# Os logs agora usam 'log' em vez de 'logger'
# Exemplo: log.info("Mensagem") em vez de logger.info("Mensagem")
```

### 3. Verificar Injeção de Dependência com @RequiredArgsConstructor

**Teste nos Controllers:**
```java
// Antes: @Autowired private DataService dataService;
// Depois: private final DataService dataService; (com @RequiredArgsConstructor)
```

## 🌍 Testando Internacionalização

### 1. Teste Básico - Diferentes Idiomas

**Inglês (padrão):**
```bash
curl -H "Accept-Language: en" http://localhost:8080/api/health
```
**Resposta esperada:**
```json
{
  "status": "UP",
  "message": "Service is running",
  "locale": "en"
}
```

**Português:**
```bash
curl -H "Accept-Language: pt" http://localhost:8080/api/health
```
**Resposta esperada:**
```json
{
  "status": "UP",
  "message": "Serviço está funcionando",
  "locale": "pt"
}
```

**Espanhol:**
```bash
curl -H "Accept-Language: es" http://localhost:8080/api/health
```
**Resposta esperada:**
```json
{
  "status": "UP",
  "message": "El servicio está funcionando",
  "locale": "es"
}
```

**Italiano:**
```bash
curl -H "Accept-Language: it" http://localhost:8080/api/health
```
**Resposta esperada:**
```json
{
  "status": "UP",
  "message": "Il servizio è in funzione",
  "locale": "it"
}
```

### 2. Teste com Parâmetro URL

```bash
# Forçar idioma via parâmetro
curl "http://localhost:8080/api/health?lang=pt"
curl "http://localhost:8080/api/health?lang=es"
curl "http://localhost:8080/api/health?lang=it"
```

### 3. Teste de Mensagens Traduzidas

**Obter exemplos de mensagens:**
```bash
curl -H "Accept-Language: pt" http://localhost:8080/api/i18n/messages
```

**Resposta esperada (português):**
```json
{
  "currentLocale": "pt",
  "language": "português",
  "messages": {
    "welcome": "Serviço está funcionando",
    "dataCreated": "Novo registro criado: Exemplo",
    "dataUpdated": "Registro atualizado: Exemplo",
    "dataDeleted": "Registro excluído (ID: 123)",
    "recordNotFound": "Registro não encontrado",
    "sseConnected": "Conexão SSE estabelecida",
    "externalDataFetched": "Dados externos obtidos: 5 registros"
  }
}
```

### 4. Teste de Idiomas Suportados

```bash
curl http://localhost:8080/api/i18n/locales
```

**Resposta esperada:**
```json
{
  "supportedLocales": [
    {"code": "en", "name": "English", "displayName": "English"},
    {"code": "pt", "name": "Português", "displayName": "Portuguese"},
    {"code": "es", "name": "Español", "displayName": "Spanish"},
    {"code": "it", "name": "Italiano", "displayName": "Italian"}
  ],
  "currentLocale": "en"
}
```

### 5. Teste de Mensagem Específica

```bash
# Testar mensagem específica
curl -H "Accept-Language: pt" http://localhost:8080/api/i18n/message/validation.name.required

# Testar com argumentos
curl -H "Accept-Language: es" "http://localhost:8080/api/i18n/message/data.created.success?args=Producto%20X"
```

## 🔄 Teste de CRUD com I18N

### 1. Criar Registro (Português)

```bash
curl -X POST http://localhost:8080/api/data \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt" \
  -d '{
    "name": "Produto Teste",
    "value": "Valor de teste"
  }'
```

**Verificar logs:** Devem aparecer em português.

### 2. Buscar Registro (Espanhol)

```bash
curl -H "Accept-Language: es" http://localhost:8080/api/data/1
```

### 3. Atualizar Registro (Italiano)

```bash
curl -X PUT http://localhost:8080/api/data/1 \
  -H "Content-Type: application/json" \
  -H "Accept-Language: it" \
  -d '{
    "name": "Prodotto Aggiornato",
    "value": "Valore aggiornato"
  }'
```

### 4. Deletar Registro (Português)

```bash
curl -X DELETE http://localhost:8080/api/data/1 \
  -H "Accept-Language: pt"
```

## 📊 Teste de SSE com I18N

### 1. Conectar ao Stream SSE

```bash
# Terminal 1 - Conectar ao stream
curl -H "Accept-Language: pt" http://localhost:8080/api/notifications/stream
```

### 2. Enviar Notificação de Teste

```bash
# Terminal 2 - Enviar notificação
curl -X POST http://localhost:8080/api/notifications/test \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt" \
  -d '{"message": "Minha notificação em português"}'
```

### 3. Forçar Busca de Dados Externos

```bash
curl -X POST http://localhost:8080/api/notifications/force-fetch \
  -H "Accept-Language: es"
```

## 🎯 Teste de Validação I18N

### 1. Teste de Campo Obrigatório

```bash
# Enviar dados inválidos
curl -X POST http://localhost:8080/api/data \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt" \
  -d '{
    "name": "",
    "value": "Teste"
  }'
```

**Resposta esperada:** Mensagem de erro em português.

### 2. Teste de Tamanho Máximo

```bash
# Nome muito longo
curl -X POST http://localhost:8080/api/data \
  -H "Content-Type: application/json" \
  -H "Accept-Language: es" \
  -d '{
    "name": "Nome muito longo que excede o limite de 100 caracteres estabelecido pela validação do campo name da entidade DataEntity",
    "value": "Teste"
  }'
```

## 🔍 Verificação de Logs Multilíngues

**Observar no console da aplicação:**

1. **Logs em Português:**
```
INFO - Buscando todos os dados
INFO - Criando novo registro: Produto Teste
INFO - Conexão SSE estabelecida
```

2. **Logs em Inglês:**
```
INFO - Fetching all data
INFO - Creating new record: Test Product
INFO - SSE connection established
```

## 📱 Teste via Swagger UI

1. **Acessar:** http://localhost:8080/swagger-ui.html

2. **Testar com diferentes idiomas:**
   - Adicionar header `Accept-Language: pt` nas requisições
   - Verificar respostas traduzidas

3. **Endpoints específicos de I18N:**
   - `/api/i18n/messages`
   - `/api/i18n/locales`
   - `/api/i18n/message/{key}`

## ✅ Checklist de Validação

### Lombok
- [ ] Métodos getters/setters funcionam automaticamente
- [ ] toString() retorna formato legível
- [ ] Logs usam @Slf4j (variável `log`)
- [ ] Construtores gerados automaticamente
- [ ] Injeção de dependência com @RequiredArgsConstructor

### Internacionalização
- [ ] Mensagens em português funcionam
- [ ] Mensagens em espanhol funcionam
- [ ] Mensagens em italiano funcionam
- [ ] Inglês como fallback padrão
- [ ] Header Accept-Language é respeitado
- [ ] Parâmetro ?lang= funciona
- [ ] Validações traduzidas
- [ ] Logs multilíngues
- [ ] SSE com mensagens traduzidas

## 🚨 Possíveis Problemas e Soluções

### Lombok não funciona
```bash
# Verificar se a dependência está no pom.xml
mvn dependency:tree | grep lombok

# Recompilar
mvn clean compile
```

### Mensagens não traduzem
```bash
# Verificar se os arquivos .properties existem
ls -la src/main/resources/messages*.properties

# Verificar encoding UTF-8
file src/main/resources/messages_pt.properties
```

### Headers não funcionam
```bash
# Testar com curl verbose
curl -v -H "Accept-Language: pt" http://localhost:8080/api/health
```

## 🎉 Resultado Esperado

Após todos os testes, você deve ter:

1. **Backend com Lombok:** Código mais limpo e menos verboso
2. **I18N funcionando:** Mensagens em 4 idiomas diferentes
3. **Logs multilíngues:** Logs da aplicação no idioma correto
4. **API documentada:** Swagger com informações de I18N
5. **SSE internacionalizado:** Notificações em tempo real traduzidas