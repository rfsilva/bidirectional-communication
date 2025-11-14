package com.example.ssedemo.service;

import com.example.ssedemo.model.UserMessage;
import com.example.ssedemo.model.User;
import com.example.ssedemo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Serviço para simular captura de mensagens de sistemas externos.
 * Similar ao ExternalDataService, mas para mensagens.
 * Agora com suporte a notificações SSE individuais.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExternalMessageService {

    private final UserMessageService userMessageService;
    private final UserRepository userRepository;
    private final SSENotificationService sseNotificationService;
    private final Random random = new Random();

    // Simulação de diferentes sistemas externos
    private static final String[] EXTERNAL_SOURCES = {
        "REPORT_SYSTEM",
        "NOTIFICATION_CENTER", 
        "BILLING_SYSTEM",
        "SECURITY_ALERTS",
        "BACKUP_SYSTEM",
        "MONITORING_SYSTEM"
    };

    // Templates de mensagens por sistema
    private static final MessageTemplate[] MESSAGE_TEMPLATES = {
        // REPORT_SYSTEM
        new MessageTemplate("REPORT_SYSTEM", "Relatório Pronto", 
            "Seu relatório mensal foi gerado com sucesso e está disponível para download.", 
            UserMessage.MessageType.SUCCESS, UserMessage.Priority.NORMAL),
        new MessageTemplate("REPORT_SYSTEM", "Erro na Geração de Relatório", 
            "Houve um erro ao gerar seu relatório. Tente novamente em alguns minutos.", 
            UserMessage.MessageType.ERROR, UserMessage.Priority.HIGH),
        new MessageTemplate("REPORT_SYSTEM", "Relatório Agendado", 
            "Seu relatório foi agendado para processamento e será enviado em breve.", 
            UserMessage.MessageType.INFO, UserMessage.Priority.LOW),
            
        // NOTIFICATION_CENTER
        new MessageTemplate("NOTIFICATION_CENTER", "Atualização do Sistema", 
            "O sistema será atualizado hoje às 23h. Pode haver indisponibilidade temporária.", 
            UserMessage.MessageType.WARNING, UserMessage.Priority.HIGH),
        new MessageTemplate("NOTIFICATION_CENTER", "Nova Funcionalidade", 
            "Uma nova funcionalidade foi adicionada ao sistema. Confira as novidades!", 
            UserMessage.MessageType.INFO, UserMessage.Priority.NORMAL),
            
        // BILLING_SYSTEM
        new MessageTemplate("BILLING_SYSTEM", "Fatura Disponível", 
            "Sua fatura do mês está disponível para visualização e pagamento.", 
            UserMessage.MessageType.INFO, UserMessage.Priority.NORMAL),
        new MessageTemplate("BILLING_SYSTEM", "Pagamento Confirmado", 
            "Seu pagamento foi processado com sucesso. Obrigado!", 
            UserMessage.MessageType.SUCCESS, UserMessage.Priority.LOW),
        new MessageTemplate("BILLING_SYSTEM", "Fatura Vencida", 
            "Sua fatura está vencida. Regularize sua situação para evitar suspensão.", 
            UserMessage.MessageType.ERROR, UserMessage.Priority.URGENT),
            
        // SECURITY_ALERTS
        new MessageTemplate("SECURITY_ALERTS", "Login Suspeito Detectado", 
            "Detectamos um login de localização não usual. Se não foi você, altere sua senha.", 
            UserMessage.MessageType.WARNING, UserMessage.Priority.URGENT),
        new MessageTemplate("SECURITY_ALERTS", "Senha Alterada", 
            "Sua senha foi alterada com sucesso. Se não foi você, entre em contato conosco.", 
            UserMessage.MessageType.INFO, UserMessage.Priority.HIGH),
            
        // BACKUP_SYSTEM
        new MessageTemplate("BACKUP_SYSTEM", "Backup Concluído", 
            "Backup dos seus dados foi realizado com sucesso.", 
            UserMessage.MessageType.SUCCESS, UserMessage.Priority.LOW),
        new MessageTemplate("BACKUP_SYSTEM", "Falha no Backup", 
            "Houve uma falha no backup automático. Verifique suas configurações.", 
            UserMessage.MessageType.ERROR, UserMessage.Priority.HIGH),
            
        // MONITORING_SYSTEM
        new MessageTemplate("MONITORING_SYSTEM", "Uso Alto de Recursos", 
            "Detectamos uso alto de recursos em sua conta. Monitore suas atividades.", 
            UserMessage.MessageType.WARNING, UserMessage.Priority.NORMAL),
        new MessageTemplate("MONITORING_SYSTEM", "Sistema Operacional", 
            "Todos os sistemas estão funcionando normalmente.", 
            UserMessage.MessageType.SUCCESS, UserMessage.Priority.LOW)
    };

    /**
     * Executa busca inicial de mensagens quando a aplicação inicia.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("🚀 Aplicação iniciada - Executando busca inicial de mensagens externas");
        try {
            List<UserMessage> initialUserMessages = simulateExternalMessageFetch();
            log.info("✅ Busca inicial concluída: {} mensagens importadas", initialUserMessages.size());
        } catch (Exception e) {
            log.error("❌ Erro na busca inicial de mensagens externas: {}", e.getMessage(), e);
        }
    }

    /**
     * Executa busca periódica de mensagens externas a cada 2 minutos.
     */
    @Scheduled(fixedRate = 20000) // 20 segundos
    public void fetchExternalMessagesPeriodically() {
        try {
            List<UserMessage> newUserMessages = simulateExternalMessageFetch();
            if (!newUserMessages.isEmpty()) {
                log.info("📨 Busca periódica: {} novas mensagens importadas", newUserMessages.size());
            } else {
                log.debug("📭 Busca periódica: nenhuma nova mensagem encontrada");
            }
        } catch (Exception e) {
            log.error("❌ Erro na busca periódica de mensagens: {}", e.getMessage(), e);
        }
    }

    /**
     * Força uma busca manual de mensagens externas.
     */
    public List<UserMessage> forceExternalMessageFetch() {
        log.info("🔄 Forçando busca manual de mensagens externas");
        try {
            List<UserMessage> userMessages = simulateExternalMessageFetch();
            log.info("✅ Busca manual concluída: {} mensagens importadas", userMessages.size());
            return userMessages;
        } catch (Exception e) {
            log.error("❌ Erro na busca manual de mensagens: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Simula chamada para API externa que retorna mensagens.
     */
    public List<UserMessage> simulateExternalAPICall() {
        log.debug("🌐 Simulando chamada para APIs externas de mensagens...");
        
        List<UserMessage> userMessages = new ArrayList<>();
        List<User> activeUsers = userRepository.findByIsActiveTrue();
        
        if (activeUsers.isEmpty()) {
            log.warn("⚠️ Nenhum usuário ativo encontrado para receber mensagens");
            return userMessages;
        }

        // Simular entre 0 a 3 mensagens por execução
        int messageCount = random.nextInt(4);
        
        for (int i = 0; i < messageCount; i++) {
            try {
                // Selecionar usuário aleatório
                User randomUser = activeUsers.get(random.nextInt(activeUsers.size()));
                
                // Selecionar template de mensagem aleatório
                MessageTemplate template = MESSAGE_TEMPLATES[random.nextInt(MESSAGE_TEMPLATES.length)];
                
                // Personalizar mensagem com dados dinâmicos
                String personalizedContent = personalizeMessageContent(template.content, randomUser);
                
                UserMessage userMessage = userMessageService.createExternalMessage(
                    randomUser.getId(),
                    template.title,
                    personalizedContent,
                    template.type,
                    template.priority,
                    template.source
                );
                
                userMessages.add(userMessage);
                
                // 🆕 ENVIAR NOTIFICAÇÃO SSE INDIVIDUAL PARA O USUÁRIO
                sendMessageNotificationToUser(userMessage);
                
                log.debug("📨 Mensagem externa criada: {} para usuário {} (ID: {})", 
                         template.title, randomUser.getUsername(), randomUser.getId());
                
            } catch (Exception e) {
                log.error("❌ Erro ao criar mensagem externa: {}", e.getMessage());
            }
        }
        
        return userMessages;
    }

    /**
     * 🆕 Envia notificação SSE individual para o usuário que recebeu uma nova mensagem.
     */
    private void sendMessageNotificationToUser(UserMessage userMessage) {
        try {
            User user = userMessage.getUser();
            
            // Verificar se o usuário tem conexões SSE ativas
            int userConnections = sseNotificationService.getActiveConnectionsCountForUser(user.getId());
            
            if (userConnections > 0) {
                // Enviar notificação SSE individual
                sseNotificationService.sendNewMessageNotification(
                    user.getId(),
                    userMessage.getTitle(),
                    userMessage.getContent(),
                    userMessage.getType().name(),
                    userMessage.getId()
                );
                
                log.info("🔔 Notificação SSE enviada para usuário {} (ID: {}) - {} conexões ativas", 
                        user.getUsername(), user.getId(), userConnections);
            } else {
                log.debug("📱 Usuário {} (ID: {}) não tem conexões SSE ativas - notificação não enviada", 
                         user.getUsername(), user.getId());
            }
            
        } catch (Exception e) {
            log.error("❌ Erro ao enviar notificação SSE para mensagem ID {}: {}", 
                     userMessage.getId(), e.getMessage());
        }
    }

    /**
     * Método principal que simula a busca de mensagens externas.
     */
    private List<UserMessage> simulateExternalMessageFetch() {
        // Simular delay de rede
        try {
            Thread.sleep(random.nextInt(1000) + 500); // 500-1500ms
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Simulação de delay interrompida");
        }
        
        return simulateExternalAPICall();
    }

    /**
     * Personaliza o conteúdo da mensagem com dados do usuário.
     */
    private String personalizeMessageContent(String template, User user) {
        String content = template;
        
        // Substituir placeholders
        content = content.replace("{username}", user.getUsername());
        content = content.replace("{fullName}", user.getFullName());
        content = content.replace("{timestamp}", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        
        // Adicionar informações específicas baseadas no tipo de mensagem
        if (template.contains("relatório")) {
            content += " Código do relatório: RPT-" + System.currentTimeMillis();
        } else if (template.contains("fatura")) {
            content += " Valor: R$ " + String.format("%.2f", (random.nextDouble() * 1000 + 100));
        } else if (template.contains("backup")) {
            content += " Tamanho: " + (random.nextInt(500) + 50) + " MB";
        }
        
        return content;
    }

    /**
     * Cria mensagem específica para um usuário (para testes).
     */
    public UserMessage createTestMessage(Long userId, String source) {
        MessageTemplate template = getTemplateBySource(source);
        if (template == null) {
            template = MESSAGE_TEMPLATES[0]; // Fallback
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));
        
        String personalizedContent = personalizeMessageContent(template.content, user);
        
        UserMessage userMessage = userMessageService.createExternalMessage(
            userId,
            template.title,
            personalizedContent,
            template.type,
            template.priority,
            template.source
        );
        
        // 🆕 Enviar notificação SSE para o teste também
        sendMessageNotificationToUser(userMessage);
        
        return userMessage;
    }

    /**
     * 🆕 Cria uma mensagem de teste personalizada e envia notificação SSE.
     */
    public UserMessage createCustomTestMessage(Long userId, String title, String content, 
                                             UserMessage.MessageType type, UserMessage.Priority priority) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));
        
        UserMessage userMessage = userMessageService.createExternalMessage(
            userId,
            title,
            content,
            type,
            priority,
            "TEST_SYSTEM"
        );
        
        // Enviar notificação SSE
        sendMessageNotificationToUser(userMessage);
        
        log.info("📨 Mensagem de teste personalizada criada para usuário {} (ID: {}): {}", 
                user.getUsername(), userId, title);
        
        return userMessage;
    }

    /**
     * Busca template por fonte externa.
     */
    private MessageTemplate getTemplateBySource(String source) {
        for (MessageTemplate template : MESSAGE_TEMPLATES) {
            if (template.source.equals(source)) {
                return template;
            }
        }
        return null;
    }

    /**
     * 🆕 Obtém estatísticas das notificações SSE enviadas.
     */
    public Map<String, Object> getNotificationStats() {
        return Map.of(
            "totalActiveConnections", sseNotificationService.getActiveConnectionsCount(),
            "activeUsers", sseNotificationService.getActiveUsersCount(),
            "connectionStats", sseNotificationService.getConnectionStats(),
            "availableSources", EXTERNAL_SOURCES,
            "availableTemplates", MESSAGE_TEMPLATES.length
        );
    }

    /**
     * Classe interna para templates de mensagens.
     */
    private static class MessageTemplate {
        final String source;
        final String title;
        final String content;
        final UserMessage.MessageType type;
        final UserMessage.Priority priority;

        MessageTemplate(String source, String title, String content,
                        UserMessage.MessageType type, UserMessage.Priority priority) {
            this.source = source;
            this.title = title;
            this.content = content;
            this.type = type;
            this.priority = priority;
        }
    }
}