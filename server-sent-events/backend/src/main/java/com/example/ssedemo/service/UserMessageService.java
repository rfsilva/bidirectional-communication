package com.example.ssedemo.service;

import com.example.ssedemo.model.UserMessage;
import com.example.ssedemo.model.User;
import com.example.ssedemo.repository.UserMessageRepository;
import com.example.ssedemo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Serviço para gerenciamento de mensagens de usuários.
 * Implementa controle de acesso baseado em roles e notificações SSE.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserMessageService {

    private final UserMessageRepository userMessageRepository;
    private final UserRepository userRepository;
    private final SSENotificationService sseNotificationService;

    /**
     * Cria uma nova mensagem para um usuário.
     */
    public UserMessage createMessage(UserMessage userMessage) {
        log.info("Criando nova mensagem para usuário ID: {}", userMessage.getUser().getId());
        UserMessage savedMessage = userMessageRepository.save(userMessage);
        
        // 🆕 Enviar notificação SSE se a mensagem não for externa (mensagens externas já enviam no ExternalMessageService)
        if (!userMessage.getIsExternal()) {
            sendMessageNotificationToUser(savedMessage);
        }
        
        return savedMessage;
    }

    /**
     * Cria uma mensagem para um usuário específico.
     */
    public UserMessage createMessageForUser(Long userId, String title, String content,
                                            UserMessage.MessageType type, UserMessage.Priority priority) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));
        
        UserMessage userMessage = new UserMessage(title, content, type, priority, user, null);
        return createMessage(userMessage);
    }

    /**
     * Cria uma mensagem externa para um usuário.
     */
    public UserMessage createExternalMessage(Long userId, String title, String content,
                                             UserMessage.MessageType type, UserMessage.Priority priority,
                                             String externalSource) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));
        
        UserMessage userMessage = new UserMessage(title, content, type, priority, user, externalSource);
        log.info("Criando mensagem externa de '{}' para usuário: {}", externalSource, user.getUsername());
        
        // Para mensagens externas, salvamos sem enviar notificação aqui (será enviada no ExternalMessageService)
        return userMessageRepository.save(userMessage);
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
     * Busca mensagem por ID com controle de acesso.
     * CORRIGIDO: Usa findByIdWithUser para evitar LazyInitializationException.
     */
    @Transactional(readOnly = true)
    public Optional<UserMessage> findById(Long id, User currentUser) {
        Optional<UserMessage> messageOpt = userMessageRepository.findByIdWithUser(id);
        
        if (messageOpt.isPresent()) {
            UserMessage userMessage = messageOpt.get();
            validateUserAccess(userMessage, currentUser);
            return messageOpt;
        }
        
        return Optional.empty();
    }

    /**
     * Busca todas as mensagens com controle de acesso por role.
     */
    @Transactional(readOnly = true)
    public List<UserMessage> findAllMessages(User currentUser) {
        if (currentUser.getRole() == User.Role.ADMIN) {
            log.debug("ADMIN {} acessando todas as mensagens", currentUser.getUsername());
            return userMessageRepository.findAllOrderByCreatedAtDesc();
        } else {
            log.debug("Usuário {} acessando apenas suas mensagens", currentUser.getUsername());
            return userMessageRepository.findByUserOrderByCreatedAtDesc(currentUser);
        }
    }

    /**
     * Busca mensagens de um usuário específico (apenas ADMIN pode acessar mensagens de outros).
     */
    @Transactional(readOnly = true)
    public List<UserMessage> findMessagesByUserId(Long userId, User currentUser) {
        // ADMIN pode ver mensagens de qualquer usuário
        if (currentUser.getRole() == User.Role.ADMIN) {
            log.debug("ADMIN {} acessando mensagens do usuário ID: {}", currentUser.getUsername(), userId);
            return userMessageRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }
        
        // Outros usuários só podem ver suas próprias mensagens
        if (!currentUser.getId().equals(userId)) {
            log.warn("Usuário {} tentou acessar mensagens do usuário ID: {} - ACESSO NEGADO", 
                    currentUser.getUsername(), userId);
            throw new AccessDeniedException("Você não tem permissão para acessar mensagens de outros usuários");
        }
        
        return userMessageRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Busca mensagens não lidas do usuário.
     */
    @Transactional(readOnly = true)
    public List<UserMessage> findUnreadMessages(User currentUser) {
        return userMessageRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(currentUser);
    }

    /**
     * Busca mensagens não lidas por ID do usuário com controle de acesso.
     */
    @Transactional(readOnly = true)
    public List<UserMessage> findUnreadMessagesByUserId(Long userId, User currentUser) {
        // Verificar permissão de acesso
        if (currentUser.getRole() != User.Role.ADMIN && !currentUser.getId().equals(userId)) {
            throw new AccessDeniedException("Você não tem permissão para acessar mensagens de outros usuários");
        }
        
        return userMessageRepository.findUnreadByUserId(userId);
    }

    /**
     * Marca mensagem como lida.
     * CORRIGIDO: Usa findByIdWithUser para evitar LazyInitializationException.
     */
    public UserMessage markAsRead(Long messageId, User currentUser) {
        UserMessage userMessage = userMessageRepository.findByIdWithUser(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Mensagem não encontrada: " + messageId));
        
        validateUserAccess(userMessage, currentUser);
        
        userMessage.markAsRead();
        log.info("Mensagem ID {} marcada como lida pelo usuário {}", messageId, currentUser.getUsername());
        return userMessageRepository.save(userMessage);
    }

    /**
     * Marca mensagem como não lida.
     * CORRIGIDO: Usa findByIdWithUser para evitar LazyInitializationException.
     */
    public UserMessage markAsUnread(Long messageId, User currentUser) {
        UserMessage userMessage = userMessageRepository.findByIdWithUser(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Mensagem não encontrada: " + messageId));
        
        validateUserAccess(userMessage, currentUser);
        
        userMessage.markAsUnread();
        log.info("Mensagem ID {} marcada como não lida pelo usuário {}", messageId, currentUser.getUsername());
        return userMessageRepository.save(userMessage);
    }

    /**
     * Marca todas as mensagens do usuário como lidas.
     */
    public void markAllAsRead(User currentUser) {
        List<UserMessage> unreadUserMessages = findUnreadMessages(currentUser);
        unreadUserMessages.forEach(UserMessage::markAsRead);
        userMessageRepository.saveAll(unreadUserMessages);
        log.info("Todas as {} mensagens não lidas do usuário {} foram marcadas como lidas", 
                unreadUserMessages.size(), currentUser.getUsername());
    }

    /**
     * Atualiza uma mensagem (apenas o próprio usuário ou ADMIN).
     * CORRIGIDO: Usa findByIdWithUser para evitar LazyInitializationException.
     */
    public UserMessage updateMessage(Long messageId, UserMessage userMessageUpdate, User currentUser) {
        UserMessage existingUserMessage = userMessageRepository.findByIdWithUser(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Mensagem não encontrada: " + messageId));
        
        validateUserAccess(existingUserMessage, currentUser);
        
        // Atualizar apenas campos permitidos
        if (userMessageUpdate.getTitle() != null) {
            existingUserMessage.setTitle(userMessageUpdate.getTitle());
        }
        if (userMessageUpdate.getContent() != null) {
            existingUserMessage.setContent(userMessageUpdate.getContent());
        }
        if (userMessageUpdate.getType() != null) {
            existingUserMessage.setType(userMessageUpdate.getType());
        }
        if (userMessageUpdate.getPriority() != null) {
            existingUserMessage.setPriority(userMessageUpdate.getPriority());
        }
        
        log.info("Mensagem ID {} atualizada pelo usuário {}", messageId, currentUser.getUsername());
        return userMessageRepository.save(existingUserMessage);
    }

    /**
     * Exclui uma mensagem (apenas o próprio usuário ou ADMIN).
     * CORRIGIDO: Usa findByIdWithUser para evitar LazyInitializationException.
     */
    public void deleteMessage(Long messageId, User currentUser) {
        UserMessage userMessage = userMessageRepository.findByIdWithUser(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Mensagem não encontrada: " + messageId));
        
        validateUserAccess(userMessage, currentUser);
        
        userMessageRepository.delete(userMessage);
        log.info("Mensagem ID {} excluída pelo usuário {}", messageId, currentUser.getUsername());
    }

    /**
     * Conta mensagens não lidas do usuário.
     */
    @Transactional(readOnly = true)
    public long countUnreadMessages(User currentUser) {
        return userMessageRepository.countUnreadByUserId(currentUser.getId());
    }

    /**
     * Conta total de mensagens do usuário.
     */
    @Transactional(readOnly = true)
    public long countUserMessages(User currentUser) {
        return userMessageRepository.countByUserId(currentUser.getId());
    }

    /**
     * Busca mensagens criadas após uma data específica.
     */
    @Transactional(readOnly = true)
    public List<UserMessage> findMessagesAfter(LocalDateTime since, User currentUser) {
        if (currentUser.getRole() == User.Role.ADMIN) {
            return userMessageRepository.findCreatedAfter(since);
        } else {
            return userMessageRepository.findByUserIdAndCreatedAfter(currentUser.getId(), since);
        }
    }

    /**
     * Obtém estatísticas de mensagens (apenas para ADMIN).
     */
    @Transactional(readOnly = true)
    public MessageStats getMessageStats(User currentUser) {
        if (currentUser.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException("Apenas administradores podem acessar estatísticas gerais");
        }
        
        return MessageStats.builder()
                .totalMessages(userMessageRepository.countAllMessages())
                .unreadMessages(userMessageRepository.countAllUnreadMessages())
                .externalMessages(userMessageRepository.countExternalMessages())
                .lastMessageAt(userMessageRepository.findLastCreatedAt())
                .build();
    }

    /**
     * Obtém estatísticas pessoais do usuário.
     */
    @Transactional(readOnly = true)
    public UserMessageStats getUserMessageStats(User currentUser) {
        return UserMessageStats.builder()
                .totalMessages(userMessageRepository.countByUserId(currentUser.getId()))
                .unreadMessages(userMessageRepository.countUnreadByUserId(currentUser.getId()))
                .infoMessages(userMessageRepository.countByUserIdAndType(currentUser.getId(), UserMessage.MessageType.INFO))
                .successMessages(userMessageRepository.countByUserIdAndType(currentUser.getId(), UserMessage.MessageType.SUCCESS))
                .warningMessages(userMessageRepository.countByUserIdAndType(currentUser.getId(), UserMessage.MessageType.WARNING))
                .errorMessages(userMessageRepository.countByUserIdAndType(currentUser.getId(), UserMessage.MessageType.ERROR))
                .build();
    }

    /**
     * 🆕 Cria uma mensagem de teste e envia notificação SSE.
     */
    public UserMessage createTestMessageWithNotification(Long userId, String title, String content, 
                                                       UserMessage.MessageType type, UserMessage.Priority priority) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));
        
        UserMessage userMessage = new UserMessage(title, content, type, priority, user, "TEST_SYSTEM");
        UserMessage savedMessage = userMessageRepository.save(userMessage);
        
        // Enviar notificação SSE
        sendMessageNotificationToUser(savedMessage);
        
        log.info("📨 Mensagem de teste criada e notificação enviada para usuário {} (ID: {}): {}", 
                user.getUsername(), userId, title);
        
        return savedMessage;
    }

    /**
     * Valida se o usuário tem acesso à mensagem.
     */
    private void validateUserAccess(UserMessage userMessage, User currentUser) {
        // ADMIN tem acesso a todas as mensagens
        if (currentUser.getRole() == User.Role.ADMIN) {
            return;
        }
        
        // Outros usuários só podem acessar suas próprias mensagens
        if (!userMessage.getUser().getId().equals(currentUser.getId())) {
            log.warn("Usuário {} tentou acessar mensagem ID {} de outro usuário - ACESSO NEGADO", 
                    currentUser.getUsername(), userMessage.getId());
            throw new AccessDeniedException("Você não tem permissão para acessar esta mensagem");
        }
    }

    /**
     * Classe para estatísticas gerais de mensagens (ADMIN).
     */
    @lombok.Builder
    @lombok.Data
    public static class MessageStats {
        private long totalMessages;
        private long unreadMessages;
        private long externalMessages;
        private LocalDateTime lastMessageAt;
    }

    /**
     * Classe para estatísticas pessoais do usuário.
     */
    @lombok.Builder
    @lombok.Data
    public static class UserMessageStats {
        private long totalMessages;
        private long unreadMessages;
        private long infoMessages;
        private long successMessages;
        private long warningMessages;
        private long errorMessages;
    }
}