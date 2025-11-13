# 🌍 Configuração de I18N no Frontend

## 📋 Resumo das Alterações

O frontend foi configurado para **sempre solicitar mensagens em português** do backend, que por padrão responde em inglês. Esta configuração garante que a aplicação Angular sempre receba mensagens traduzidas em português.

## 🔧 Implementação

### 1. **Interceptor HTTP Automático**
- **Arquivo:** `src/app/interceptors/language.interceptor.ts`
- **Função:** Adiciona automaticamente `?lang=pt` a todas as requisições para `/api/`
- **Comportamento:** Transparente para o desenvolvedor

```typescript
// Exemplo de transformação automática:
// Requisição original: GET /api/data
// Requisição final: GET /api/data?lang=pt
```

### 2. **Serviço de Idioma**
- **Arquivo:** `src/app/services/language.service.ts`
- **Função:** Gerencia o idioma atual e fornece utilitários I18N
- **Padrão:** Português (pt)

### 3. **Configuração no main.ts**
- **Interceptor registrado** automaticamente
- **Ativo em todas as requisições** HTTP

## 🎯 Comportamento Atual

### Backend
- ✅ **Padrão:** Inglês
- ✅ **Com ?lang=pt:** Português
- ✅ **Com ?lang=es:** Espanhol
- ✅ **Com ?lang=it:** Italiano

### Frontend
- ✅ **Sempre solicita:** Português via `?lang=pt`
- ✅ **Interceptor ativo:** Adiciona parâmetro automaticamente
- ✅ **Transparente:** Desenvolvedor não precisa se preocupar

## 📊 Exemplos de Uso

### Requisições Automáticas
```typescript
// No código Angular:
this.dataService.getAllData().subscribe(data => {
  // Requisição real: GET /api/data?lang=pt
  // Resposta: mensagens em português
});

this.notificationService.sendTestNotification('teste').subscribe(response => {
  // Requisição real: POST /api/notifications/test?lang=pt
  // Resposta: {"message": "Notificação enviada", ...}
});
```

### Mudança Manual de Idioma
```typescript
// Para mudar temporariamente o idioma:
this.languageService.setLanguage('es'); // Espanhol
this.languageService.setLanguage('en'); // Inglês
this.languageService.setLanguage('pt'); // Volta para português
```

## 🧪 Como Testar

### 1. **Verificar Interceptor**
```bash
# Abrir DevTools do navegador
# Ir para Network tab
# Fazer qualquer ação no dashboard
# Verificar que todas as requisições para /api/ têm ?lang=pt
```

### 2. **Testar Diferentes Idiomas**
```typescript
// No console do navegador:
// Mudar para espanhol temporariamente
window.angular.getComponent(document.querySelector('app-dashboard')).languageService.setLanguage('es');

// Fazer uma ação (criar item, etc.)
// Verificar que a próxima requisição usa ?lang=es

// Voltar para português
window.angular.getComponent(document.querySelector('app-dashboard')).languageService.setLanguage('pt');
```

### 3. **Verificar Logs**
```javascript
// Logs do interceptor aparecem no console:
// "[LanguageInterceptor] Added lang=pt to: http://localhost:8080/api/data"
```

## 📁 Arquivos Criados/Modificados

### Novos Arquivos
```
frontend/src/app/
├── interceptors/
│   └── language.interceptor.ts
├── services/
│   └── language.service.ts
└── components/
    └── language-test/
        └── language-test.component.ts
```

### Arquivos Modificados
```
frontend/src/
├── main.ts (+ interceptor registration)
└── app/components/dashboard/
    ├── dashboard.component.ts (+ I18N info)
    └── dashboard.component.html (+ I18N section)
```

## 🎨 Interface do Usuário

### Seção I18N no Dashboard
- **Idioma atual:** Exibe português com bandeira 🇧🇷
- **Botões de idioma:** Permite mudança temporária
- **Status do interceptor:** Mostra que está ativo
- **Exemplo de mensagem:** Mostra mensagem atual traduzida

### Informações Visuais
- **Bandeiras:** 🇧🇷 🇺🇸 🇪🇸 🇮🇹
- **Status:** ✅ Interceptor ativo
- **Comportamento:** Explicação clara do funcionamento

## 🔍 Debug e Monitoramento

### Console Logs
```javascript
// Interceptor
"[LanguageInterceptor] Added lang=pt to: /api/data"

// Language Service
"🗣️ Idioma atual: pt"
"🌍 Informações I18N: {...}"

// Dashboard
"📊 Dados carregados (com ?lang=pt automático): 5 registros"
"📝 Criando item (mensagens virão em português via ?lang=pt)..."
```

### Network Tab
```
GET /api/data?lang=pt
POST /api/data?lang=pt
GET /api/notifications/status?lang=pt
```

## ⚙️ Configurações Avançadas

### Alterar Idioma Padrão
```typescript
// Em language.interceptor.ts
private readonly DEFAULT_LANGUAGE = 'es'; // Mudar para espanhol

// Em language.service.ts
const savedLanguage = localStorage.getItem('app-language') || 'es';
```

### Desabilitar Interceptor
```typescript
// Em main.ts - comentar ou remover:
// {
//   provide: HTTP_INTERCEPTORS,
//   useClass: LanguageInterceptor,
//   multi: true
// }
```

### Adicionar Novos Idiomas
```typescript
// Em language.service.ts
private readonly AVAILABLE_LANGUAGES = [
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }, // Novo
];
```

## 🎉 Resultado Final

### ✅ O que funciona agora:
1. **Interceptor automático** adiciona `?lang=pt` a todas as requisições
2. **Backend responde em português** para todas as ações do frontend
3. **Interface mostra status I18N** com informações claras
4. **Mudança de idioma** funciona temporariamente
5. **Logs detalhados** para debug e monitoramento
6. **Transparente para o desenvolvedor** - não precisa lembrar de adicionar parâmetros

### 🔄 Fluxo Completo:
1. **Usuário clica** em "Criar Item"
2. **Angular faz** `POST /api/data`
3. **Interceptor adiciona** `?lang=pt` automaticamente
4. **Backend recebe** `POST /api/data?lang=pt`
5. **Backend responde** com mensagens em português
6. **Frontend exibe** mensagens traduzidas
7. **SSE envia notificações** também em português

A aplicação agora está completamente configurada para usar português como idioma padrão, mantendo a flexibilidade de mudança quando necessário! 🇧🇷✨