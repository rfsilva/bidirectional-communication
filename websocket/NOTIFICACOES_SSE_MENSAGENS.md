# 📨 Notificações SSE de Mensagens - Guia de Implementação

## 🎯 Objetivo

Implementar notificações SSE (Server-Sent Events) individuais para mensagens, onde cada usuário recebe notificações em tempo real apenas das mensagens direcionadas para ele.

## 🚀 Funcionalidades Implementadas

### Backend

1. **SSENotificationService Atualizado**
   - Suporte a notificações por usuário específico
   - Mapeamento de conexões SSE por ID do usuário
   - Método `sendNewMessageNotification()` para notificações de mensagens
   - Estatísticas detalhadas de conexões por usuário

2. **SSEController Atualizado**
   - Autenticação via token JWT (header ou query parameter)
   - Endpoint `/api/notifications/stream` com autenticação por usuário
   - Endpoint de teste `/api/notifications/test/user/{userId}` (apenas ADMIN)
   - Status detalhado das conexões SSE por usuário

3. **ExternalMessageService Atualizado**
   - Envio automático de notificações SSE quando mensagens são criadas
   - Método `createCustomTestMessage()` para testes
   - Verificação de conexões ativas antes de enviar notificações

4. **UserMessageService Atualizado**
   - Notificações SSE para mensagens criadas manualmente
   - Método `createTestMessageWithNotification()` para testes

5. **UserMessageController Atualizado**
   - Endpoint `/api/messages/test/{userId}` para criar mensagens de teste (ADMIN)

### Frontend

1. **SSEService Atualizado**
   - Observable específico `messageNotifications$` para notificações de mensagens
   - Listener para evento `newMessage`
   - Método `clearMessageNotifications()`

2. **DashboardComponent Atualizado**
   - Painel separado para notificações de mensagens
   - Abas para notificações gerais e de mensagens
   - Badges visuais para diferentes tipos de notificações
   - Contadores independentes para cada tipo

3. **MessageListComponent Atualizado**
   - Recebe notificações SSE quando na tela de mensagens
   - Painel de notificações recentes
   - Status da conexão SSE
   - Destaque visual para novas mensagens
   - Recarregamento automático da lista quando nova mensagem chega

## 🔧 Como Testar

### 1. Preparação do Ambiente

```bash
# Backend
cd backend
./mvnw spring-boot:run

# Frontend
cd frontend
npm start
```

### 2. Cenários de Teste

#### Teste 1: Notificação Automática (Simulação Externa)
1. Faça login com qualquer usuário
2. Aguarde até 2 minutos (busca automática de mensagens externas)
3. Observe as notificações chegando no dashboard e na tela de mensagens

#### Teste 2: Notificação Manual (ADMIN)
1. Faça login como ADMIN (admin/admin123)
2. Use o endpoint de teste via Postman ou curl:

```bash
# Criar mensagem de teste para usuário ID 2
curl -X POST "http://localhost:8080/api/messages/test/2" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Teste de Notificação",
    "content": "Esta é uma mensagem de teste para verificar as notificações SSE",
    "type": "SUCCESS",
    "priority": "HIGH"
  }'
```

#### Teste 3: Múltiplos Usuários
1. Abra múltiplas abas/janelas do navegador
2. Faça login com usuários diferentes em cada aba
3. Como ADMIN, envie mensagens de teste para diferentes usuários
4. Observe que cada usuário recebe apenas suas próprias notificações

#### Teste 4: Teste na Tela de Mensagens
1. Navegue para `/messages` 
2. Mantenha a tela aberta
3. Em outra aba, como ADMIN, envie uma mensagem de teste para seu usuário
4. Observe a notificação aparecer na tela de mensagens e a lista ser atualizada

### 3. Endpoints de Teste

#### Criar Mensagem de Teste (ADMIN apenas)
```
POST /api/messages/test/{userId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Título da mensagem",
  "content": "Conteúdo da mensagem",
  "type": "SUCCESS|ERROR|WARNING|INFO",
  "priority": "LOW|NORMAL|HIGH|URGENT"
}
```

#### Forçar Busca Externa (ADMIN apenas)
```
POST /api/messages/external/force-fetch
Authorization: Bearer {token}
```

#### Status das Conexões SSE
```
GET /api/notifications/status
Authorization: Bearer {token}
```

#### Status do Usuário Atual
```
GET /api/notifications/status/user
Authorization: Bearer {token}
```

## 📱 Interface do Usuário

### Dashboard
- **Badge de Notificações Gerais**: Canto superior direito (azul)
- **Badge de Notificações de Mensagens**: Abaixo do badge geral (azul claro)
- **Painel de Notificações**: Coluna direita com abas separadas
  - Aba "📢 Gerais": Notificações de sistema (dados, conexão, etc.)
  - Aba "📨 Mensagens": Notificações específicas de mensagens

### Tela de Mensagens
- **Status SSE**: Barra no topo indicando conexão ativa/inativa
- **Painel de Notificações Recentes**: Mostra últimas 5 notificações
- **Destaque Visual**: Novas mensagens são destacadas automaticamente
- **Atualização Automática**: Lista recarrega quando nova mensagem chega

## 🎨 Indicadores Visuais

### Tipos de Mensagem
- **SUCCESS**: ✅ Verde
- **ERROR**: ❌ Vermelho  
- **WARNING**: ⚠️ Amarelo
- **INFO**: ℹ️ Azul

### Prioridades
- **URGENT**: 🔴 Vermelho intenso
- **HIGH**: 🟠 Laranja
- **NORMAL**: 🔵 Azul
- **LOW**: ⚪ Cinza

### Estados de Conexão
- **Conectado**: 🟢 Verde com animação de pulso
- **Desconectado**: 🔴 Vermelho

## 🔍 Debug e Monitoramento

### Logs do Backend
```bash
# Filtrar logs de SSE e mensagens
tail -f logs/application.log | grep -E "(SSE|Message|Notification)"
```

### Console do Frontend
- Todas as notificações SSE são logadas no console
- Estados de conexão são mostrados em tempo real
- Erros de autenticação e reconexão são detalhados

### Informações de Debug
- Dashboard mostra informações técnicas da conexão SSE
- Status das conexões disponível via API
- Contadores de usuários ativos e conexões por usuário

## 🛠️ Configurações

### Timeout da Conexão SSE
```java
// Backend - SSENotificationService.java
SseEmitter emitter = new SseEmitter(0L); // Timeout infinito
```

### Intervalo de Reconexão
```typescript
// Frontend - sse.service.ts
private reconnectDelay = 3000; // 3 segundos inicial
private maxReconnectAttempts = 5; // Máximo 5 tentativas
```

### Busca Automática de Mensagens
```java
// Backend - ExternalMessageService.java
@Scheduled(fixedRate = 120000) // A cada 2 minutos
```

## 🚨 Troubleshooting

### Problema: Notificações não chegam
1. Verificar se usuário está autenticado
2. Verificar conexão SSE no dashboard (deve estar verde)
3. Verificar logs do backend para erros de token
4. Testar endpoint `/api/notifications/status/user`

### Problema: Conexão SSE falha
1. Verificar se token JWT é válido
2. Verificar CORS no backend
3. Verificar se porta 8080 está acessível
4. Tentar reconexão manual no dashboard

### Problema: Usuário recebe notificações de outros
1. Verificar implementação de `sendNotificationToUser()`
2. Verificar mapeamento de usuários no `SSENotificationService`
3. Verificar logs de autenticação no backend

## 📋 Checklist de Funcionalidades

- ✅ Notificações SSE individuais por usuário
- ✅ Autenticação JWT para conexões SSE
- ✅ Notificações automáticas (mensagens externas)
- ✅ Notificações manuais (criação de mensagens)
- ✅ Interface separada para notificações de mensagens
- ✅ Notificações na tela de mensagens
- ✅ Destaque visual para novas mensagens
- ✅ Contadores independentes por tipo
- ✅ Status de conexão em tempo real
- ✅ Endpoints de teste para ADMIN
- ✅ Logs detalhados e debug
- ✅ Responsividade mobile
- ✅ Reconexão automática
- ✅ Limpeza de notificações antigas

## 🎉 Resultado Final

O sistema agora possui notificações SSE completas e individuais para mensagens, onde:

1. **Cada usuário recebe apenas suas próprias notificações**
2. **Notificações aparecem em tempo real no dashboard e na tela de mensagens**
3. **Interface intuitiva com badges e painéis separados**
4. **Sistema robusto com reconexão automática e tratamento de erros**
5. **Ferramentas de teste e debug para administradores**

As notificações funcionam tanto para mensagens criadas automaticamente (simulação de sistemas externos) quanto para mensagens criadas manualmente, proporcionando uma experiência completa de comunicação em tempo real.