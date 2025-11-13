# 📮 Guia Completo - Postman Collection SSE Demo

## 🚀 Como Importar e Usar

### 1. **Importar no Postman**
1. Abrir Postman
2. Clicar em **Import**
3. Arrastar os arquivos ou selecionar:
   - `SSE-Demo-Environment.postman_environment.json`
   - `SSE-Demo-API.postman_collection.json`
4. Selecionar o environment **"SSE Demo Environment"**

### 2. **Configurar Environment**
Verificar/ajustar as variáveis:
- `baseUrl`: http://localhost:8080
- `language`: pt (ou en, es, it)
- Outras variáveis são preenchidas automaticamente

## 📁 **Estrutura da Collection**

### 🏥 **Health & Status**
- **Health Check**: Verificação básica + I18N
- **Health Check - English**: Teste específico em inglês
- **Health Check - Portuguese**: Teste específico em português

### 📊 **Data Management**
- **Get All Data**: Lista todos os registros
- **Create New Data**: Cria novo registro (salva ID automaticamente)
- **Get Data by ID**: Busca por ID específico
- **Update Data**: Atualiza registro existente
- **Get External Data**: Apenas dados externos
- **Get Internal Data**: Apenas dados internos
- **Get Statistics**: Estatísticas gerais
- **Delete Data**: Remove registro (limpa ID automaticamente)

### 📡 **SSE & Notifications**
- **Get SSE Status**: Status das conexões SSE
- **Send Test Notification**: Envia notificação de teste
- **Force External Data Fetch**: Força busca de dados externos

### 🌍 **Internationalization (I18N)**
- **Get I18N Messages**: Exemplos de mensagens traduzidas
- **Get Supported Locales**: Lista idiomas suportados
- **Test Specific Message**: Testa mensagem específica
- **I18N Demo Behavior**: Demonstra comportamento I18N

### 🧪 **Test Scenarios**
- **Complete CRUD Flow**: Fluxo completo de testes
- **Multi-Language Test**: Teste de múltiplos idiomas

## 🎯 **Fluxo de Teste Recomendado**

### **1. Verificação Inicial**
```
1. Health Check
2. Get Supported Locales
3. Get Statistics
```

### **2. Teste I18N**
```
1. Health Check - English
2. Health Check - Portuguese
3. Get I18N Messages (com lang=pt)
4. Get I18N Messages (com lang=es)
```

### **3. CRUD Completo**
```
1. Get All Data
2. Create New Data (salva ID automaticamente)
3. Get Data by ID (usa ID salvo)
4. Update Data (usa ID salvo)
5. Get Data by ID (verifica atualização)
6. Delete Data (usa ID salvo)
7. Get Data by ID (deve retornar 404)
```

### **4. Teste SSE**
```
1. Get SSE Status
2. Send Test Notification
3. Force External Data Fetch
4. Get Statistics (verificar mudanças)
```

## 🔧 **Variáveis Automáticas**

### **Environment Variables**
- `testDataId`: ID do último item criado (preenchido automaticamente)
- `timestamp`: Timestamp atual (atualizado automaticamente)
- `testItemName`: Nome do item de teste (com timestamp)
- `testItemValue`: Valor do item de teste (com timestamp)

### **Scripts Automáticos**
- **Pre-request**: Atualiza timestamps e dados de teste
- **Tests**: Validações automáticas de resposta
- **Global**: Logs e validações gerais

## 🧪 **Testes Automatizados**

### **Validações Incluídas**
- ✅ Status codes corretos
- ✅ Estrutura de resposta JSON
- ✅ Campos obrigatórios presentes
- ✅ Tipos de dados corretos
- ✅ Tempo de resposta aceitável
- ✅ Content-Type correto
- ✅ Funcionalidade I18N
- ✅ Fluxo CRUD completo

### **Como Executar Testes**
1. **Teste Individual**: Clicar em "Send" em qualquer request
2. **Teste de Pasta**: Clicar em "..." na pasta → "Run folder"
3. **Collection Completa**: Clicar em "..." na collection → "Run collection"

## 🌍 **Testando I18N**

### **Mudança de Idioma**
1. Alterar variável `language` no environment:
   - `pt` - Português
   - `en` - Inglês  
   - `es` - Espanhol
   - `it` - Italiano

2. Executar requests e observar mensagens traduzidas

### **Teste Manual de Idiomas**
```
1. Definir language = "pt"
2. Executar "Health Check"
3. Verificar resposta em português
4. Definir language = "en"  
5. Executar "Health Check"
6. Verificar resposta em inglês
```

## 📊 **Exemplos de Respostas**

### **Health Check (Português)**
```json
{
    "status": "UP",
    "timestamp": "2024-01-15T18:30:00",
    "service": "SSE Demo Backend",
    "version": "1.0.0",
    "message": "Serviço está funcionando",
    "locale": "pt"
}
```

### **Create Data (Sucesso)**
```json
{
    "id": 123,
    "name": "Item Teste Postman - 18:30:15",
    "value": "Valor criado via Postman em 18:30:15",
    "createdAt": "2024-01-15T18:30:15",
    "updatedAt": null,
    "isExternal": false
}
```

### **Statistics**
```json
{
    "totalRecords": 45,
    "externalRecords": 20,
    "internalRecords": 25,
    "lastCreatedAt": "2024-01-15T18:30:15",
    "activeSSEConnections": 0
}
```

## 🔍 **Troubleshooting**

### **Problemas Comuns**

1. **Connection refused**
   ```
   Verificar se backend está rodando:
   docker-compose ps
   curl http://localhost:8080/api/health
   ```

2. **404 Not Found**
   ```
   Verificar URL base no environment:
   baseUrl = http://localhost:8080
   ```

3. **Teste falha**
   ```
   Verificar logs no console do Postman
   Verificar se environment está selecionado
   ```

4. **testDataId vazio**
   ```
   Executar "Create New Data" primeiro
   Verificar se teste passou e salvou o ID
   ```

### **Debug**
- Usar **Console** do Postman para ver logs
- Verificar **Tests** tab para ver resultados
- Usar **Pre-request Script** para debug de variáveis

## 🎯 **Dicas Avançadas**

### **Collection Runner**
1. Clicar em "Run collection"
2. Selecionar requests desejados
3. Configurar iterations e delay
4. Executar e ver relatório

### **Monitoring**
1. Configurar monitor no Postman Cloud
2. Executar testes periodicamente
3. Receber alertas por email

### **Newman (CLI)**
```bash
# Instalar Newman
npm install -g newman

# Executar collection
newman run SSE-Demo-API.postman_collection.json \
  -e SSE-Demo-Environment.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export report.html
```

## 📈 **Métricas de Teste**

### **Cobertura**
- ✅ 100% dos endpoints principais
- ✅ Todos os métodos HTTP (GET, POST, PUT, DELETE)
- ✅ Todos os idiomas suportados
- ✅ Cenários de erro e sucesso
- ✅ Validações automáticas

### **Performance**
- ⏱️ Tempo de resposta < 5s
- 📊 Validação de estrutura JSON
- 🔍 Logs detalhados para debug

---

**🎉 Collection completa e pronta para uso!**

Execute os testes e explore todos os endpoints da API SSE Demo! 🚀