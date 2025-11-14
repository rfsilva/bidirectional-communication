package com.example.ssedemo.service;

import com.example.ssedemo.model.NotificationMessage;
import com.example.ssedemo.model.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Serviço para gerenciamento de notificações Server-Sent Events.
 * Suporta notificações broadcast e individuais por usuário.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SSENotificationService {

    // Mapa de emitters por usuário - cada usuário pode ter múltiplas conexões
    private final Map<Long, Set<SseEmitter>> userEmitters = new ConcurrentHashMap<>();
    
    // Set de todos os emitters para broadcast (mantido para compatibilidade)
    private final Set<SseEmitter> allEmitters = Collections.newSetFromMap(new ConcurrentHashMap<>());
    
    private final ObjectMapper objectMapper;
    private final MessageService messageService;

    /**
     * Cria um novo emitter SSE e o registra para um usuário específico.
     *
     * @param user Usuário proprietário da conexão
     * @return Novo SseEmitter configurado
     */
    public SseEmitter createEmitterForUser(User user) {
        SseEmitter emitter = new SseEmitter(0L); // Timeout infinito
        
        // Configurar callbacks do emitter
        emitter.onCompletion(() -> {
            String completionMessage = messageService.getSSEMessage("connection.completed", 
                "SSE connection completed for user: " + user.getUsername());
            log.info(completionMessage);
            removeEmitterForUser(user.getId(), emitter);
        });
        
        emitter.onTimeout(() -> {
            String timeoutMessage = messageService.getSSEMessage("connection.timeout", 
                "SSE connection timed out for user: " + user.getUsername());
            log.info(timeoutMessage);
            removeEmitterForUser(user.getId(), emitter);
        });
        
        emitter.onError((ex) -> {
            String errorMessage = messageService.getSSEMessage("connection.error", 
                "SSE connection error for user " + user.getUsername() + ": {0}");
            log.error(errorMessage, ex.getMessage());
            removeEmitterForUser(user.getId(), emitter);
        });

        // Adicionar emitter aos mapas
        userEmitters.computeIfAbsent(user.getId(), k -> Collections.newSetFromMap(new ConcurrentHashMap<>()))
                   .add(emitter);
        allEmitters.add(emitter);
        
        log.info("Nova conexão SSE estabelecida para usuário {}. Conexões do usuário: {}, Total: {}", 
                user.getUsername(), 
                userEmitters.get(user.getId()).size(),
                allEmitters.size());

        // Enviar mensagem de boas-vindas
        try {
            String welcomeMessage = messageService.getSSEMessage("connection.established");
            NotificationMessage notification = new NotificationMessage(
                "CONNECTION", 
                welcomeMessage,
                Map.of(
                    "userId", user.getId(),
                    "username", user.getUsername(),
                    "timestamp", LocalDateTime.now()
                )
            );
            emitter.send(SseEmitter.event()
                .name("connection")
                .data(objectMapper.writeValueAsString(notification))
                .id(String.valueOf(System.currentTimeMillis())));
        } catch (IOException e) {
            log.error("Erro ao enviar mensagem de boas-vindas para {}: {}", user.getUsername(), e.getMessage());
            removeEmitterForUser(user.getId(), emitter);
        }

        return emitter;
    }

    /**
     * Cria um emitter SSE genérico (para compatibilidade com código existente).
     *
     * @return Novo SseEmitter configurado
     */
    public SseEmitter createEmitter() {
        SseEmitter emitter = new SseEmitter(0L);
        
        emitter.onCompletion(() -> {
            log.info("Conexão SSE genérica finalizada");
            allEmitters.remove(emitter);
        });
        
        emitter.onTimeout(() -> {
            log.info("Conexão SSE genérica expirou");
            allEmitters.remove(emitter);
        });
        
        emitter.onError((ex) -> {
            log.error("Erro na conexão SSE genérica: {}", ex.getMessage());
            allEmitters.remove(emitter);
        });

        allEmitters.add(emitter);
        log.info("Nova conexão SSE genérica estabelecida. Total de conexões: {}", allEmitters.size());

        return emitter;
    }

    /**
     * Remove um emitter específico de um usuário.
     */
    private void removeEmitterForUser(Long userId, SseEmitter emitter) {
        Set<SseEmitter> emittersForUser = userEmitters.get(userId);
        if (emittersForUser != null) {
            emittersForUser.remove(emitter);
            if (emittersForUser.isEmpty()) {
                userEmitters.remove(userId);
            }
        }
        allEmitters.remove(emitter);
    }

    /**
     * Envia uma notificação para um usuário específico.
     *
     * @param userId ID do usuário destinatário
     * @param eventName Nome do evento
     * @param message Mensagem de notificação
     */
    public void sendNotificationToUser(Long userId, String eventName, NotificationMessage message) {
        Set<SseEmitter> emittersForUser = userEmitters.get(userId);
        
        if (emittersForUser == null || emittersForUser.isEmpty()) {
            log.debug("Nenhuma conexão SSE ativa para usuário ID: {}", userId);
            return;
        }

        log.info("Enviando notificação '{}' para usuário ID {} ({} conexões): {}", 
                eventName, userId, emittersForUser.size(), message.getType());

        // Remover emitters que falharam
        emittersForUser.removeIf(emitter -> {
            try {
                String jsonData = objectMapper.writeValueAsString(message);
                emitter.send(SseEmitter.event()
                    .name(eventName)
                    .data(jsonData)
                    .id(String.valueOf(System.currentTimeMillis())));
                return false; // Manter emitter
            } catch (IOException e) {
                log.warn("Falha ao enviar notificação para usuário ID {}: {}", userId, e.getMessage());
                allEmitters.remove(emitter);
                return true; // Remover emitter
            }
        });

        // Limpar mapa se não há mais emitters para o usuário
        if (emittersForUser.isEmpty()) {
            userEmitters.remove(userId);
        }

        log.debug("Notificação enviada para usuário ID {}. Conexões restantes: {}", 
                userId, emittersForUser.size());
    }

    /**
     * Envia uma notificação para todas as conexões SSE ativas (broadcast).
     *
     * @param eventName Nome do evento
     * @param message Mensagem de notificação
     */
    public void sendNotificationToAll(String eventName, NotificationMessage message) {
        if (allEmitters.isEmpty()) {
            log.debug("Nenhuma conexão SSE disponível para broadcast");
            return;
        }

        log.info("Enviando broadcast '{}' para {} conexões: {}", 
                eventName, allEmitters.size(), message.getType());

        allEmitters.removeIf(emitter -> {
            try {
                String jsonData = objectMapper.writeValueAsString(message);
                emitter.send(SseEmitter.event()
                    .name(eventName)
                    .data(jsonData)
                    .id(String.valueOf(System.currentTimeMillis())));
                return false; // Manter emitter
            } catch (IOException e) {
                log.warn("Falha ao enviar broadcast: {}", e.getMessage());
                // Remover também dos mapas de usuário
                removeEmitterFromUserMaps(emitter);
                return true; // Remover emitter
            }
        });

        log.info("Broadcast enviado. Conexões ativas: {}", allEmitters.size());
    }

    /**
     * Remove um emitter dos mapas de usuário quando falha no broadcast.
     */
    private void removeEmitterFromUserMaps(SseEmitter emitter) {
        userEmitters.entrySet().removeIf(entry -> {
            entry.getValue().remove(emitter);
            return entry.getValue().isEmpty();
        });
    }

    /**
     * Envia notificação de nova mensagem para um usuário específico.
     *
     * @param userId ID do usuário destinatário
     * @param messageTitle Título da mensagem
     * @param messageContent Conteúdo da mensagem
     * @param messageType Tipo da mensagem
     * @param messageId ID da mensagem
     */
    public void sendNewMessageNotification(Long userId, String messageTitle, String messageContent, 
                                         String messageType, Long messageId) {
        NotificationMessage notification = new NotificationMessage(
            "NEW_MESSAGE",
            "Nova mensagem recebida: " + messageTitle,
            Map.of(
                "messageId", messageId,
                "title", messageTitle,
                "content", messageContent,
                "type", messageType,
                "timestamp", LocalDateTime.now(),
                "userId", userId
            )
        );
        
        sendNotificationToUser(userId, "newMessage", notification);
        log.info("Notificação de nova mensagem enviada para usuário ID {}: {}", userId, messageTitle);
    }

    /**
     * Envia uma notificação de atualização de dados (broadcast).
     *
     * @param message Mensagem da notificação
     * @param count Quantidade de registros afetados
     */
    public void sendDataUpdateNotification(String message, int count) {
        NotificationMessage notification = new NotificationMessage(
            "DATA_UPDATE",
            message,
            Map.of(
                "count", count,
                "timestamp", LocalDateTime.now()
            )
        );
        sendNotificationToAll("dataUpdate", notification);
    }

    /**
     * Envia uma notificação de erro (broadcast).
     *
     * @param message Mensagem de erro
     * @param error Detalhes do erro
     */
    public void sendErrorNotification(String message, String error) {
        NotificationMessage notification = new NotificationMessage(
            "ERROR",
            message,
            Map.of(
                "error", error,
                "timestamp", LocalDateTime.now()
            )
        );
        sendNotificationToAll("error", notification);
    }

    /**
     * Envia uma notificação informativa (broadcast).
     *
     * @param message Mensagem informativa
     */
    public void sendInfoNotification(String message) {
        NotificationMessage notification = new NotificationMessage(
            "INFO",
            message,
            Map.of("timestamp", LocalDateTime.now())
        );
        sendNotificationToAll("info", notification);
    }

    /**
     * Obtém o número total de conexões SSE ativas.
     *
     * @return Número de conexões ativas
     */
    public int getActiveConnectionsCount() {
        return allEmitters.size();
    }

    /**
     * Obtém o número de conexões SSE ativas para um usuário específico.
     *
     * @param userId ID do usuário
     * @return Número de conexões ativas do usuário
     */
    public int getActiveConnectionsCountForUser(Long userId) {
        Set<SseEmitter> emittersForUser = userEmitters.get(userId);
        return emittersForUser != null ? emittersForUser.size() : 0;
    }

    /**
     * Obtém o número de usuários únicos com conexões ativas.
     *
     * @return Número de usuários conectados
     */
    public int getActiveUsersCount() {
        return userEmitters.size();
    }

    /**
     * Obtém estatísticas detalhadas das conexões SSE.
     *
     * @return Mapa com estatísticas
     */
    public Map<String, Object> getConnectionStats() {
        return Map.of(
            "totalConnections", allEmitters.size(),
            "activeUsers", userEmitters.size(),
            "userConnections", userEmitters.entrySet().stream()
                .collect(java.util.stream.Collectors.toMap(
                    Map.Entry::getKey,
                    entry -> entry.getValue().size()
                ))
        );
    }
}