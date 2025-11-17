package com.example.websocketdemo.service;

import com.example.websocketdemo.model.NotificationMessage;
import com.example.websocketdemo.model.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Serviço para gerenciamento de notificações WebSocket.
 * Versão com debug melhorado para identificar problemas de mensagens específicas para usuário.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final SimpUserRegistry userRegistry;
    private final ObjectMapper objectMapper;
    private final MessageService messageService;

    // Mapa para rastrear usuários conectados e suas sessões
    private final Map<Long, String> connectedUsers = new ConcurrentHashMap<>();

    /**
     * Registra um usuário como conectado.
     *
     * @param userId ID do usuário
     * @param sessionId ID da sessão WebSocket
     */
    public void registerUserConnection(Long userId, String sessionId) {
        connectedUsers.put(userId, sessionId);
        log.info("WebSocket: ✅ Usuário {} registrado como conectado (sessão: {})", userId, sessionId);
        log.info("WebSocket: 📊 Total de usuários conectados: {}", connectedUsers.size());
        log.debug("WebSocket: 🔍 Usuários conectados: {}", connectedUsers.keySet());
    }

    /**
     * Remove o registro de um usuário conectado.
     *
     * @param userId ID do usuário
     */
    public void unregisterUserConnection(Long userId) {
        String sessionId = connectedUsers.remove(userId);
        if (sessionId != null) {
            log.info("WebSocket: ❌ Usuário {} removido da lista de conectados (sessão: {})", userId, sessionId);
        } else {
            log.warn("WebSocket: ⚠️ Tentativa de remover usuário {} que não estava registrado", userId);
        }
        log.info("WebSocket: 📊 Total de usuários conectados após remoção: {}", connectedUsers.size());
    }

    /**
     * Envia uma notificação para um usuário específico.
     *
     * @param userId ID do usuário destinatário
     * @param eventName Nome do evento
     * @param message Mensagem de notificação
     */
    public void sendNotificationToUser(Long userId, String eventName, NotificationMessage message) {
        log.info("WebSocket: 📤 Tentando enviar notificação '{}' para usuário {}", eventName, userId);
        log.debug("WebSocket: 📋 Conteúdo da mensagem: {}", message);
        
        // Verificar se usuário está conectado
        if (!connectedUsers.containsKey(userId)) {
            log.warn("WebSocket: ⚠️ Usuário {} não está na lista de conectados. Usuários conectados: {}", 
                    userId, connectedUsers.keySet());
            return;
        }

        try {
            // Tentar diferentes formatos de destino para garantir que a mensagem chegue
            String[] destinations = {
                "/queue/" + eventName,
                "/" + eventName
            };
            
            for (String destination : destinations) {
                try {
                    log.info("WebSocket: 🎯 Enviando para usuário {} no destino: /user/{}{}", 
                            userId, userId, destination);
                    
                    // Enviar usando o ID do usuário como identificador
                    messagingTemplate.convertAndSendToUser(
                        userId.toString(), 
                        destination, 
                        message
                    );
                    
                    log.info("WebSocket: ✅ Notificação '{}' enviada com sucesso para usuário {} no destino {}", 
                            eventName, userId, destination);
                    
                } catch (Exception e) {
                    log.error("WebSocket: ❌ Erro ao enviar para destino {} do usuário {}: {}", 
                            destination, userId, e.getMessage());
                }
            }
            
            // Log adicional para debug
            log.info("WebSocket: 📊 Estatísticas após envio:");
            log.info("WebSocket: - Usuários conectados no serviço: {}", connectedUsers.size());
            log.info("WebSocket: - Usuários no registry do Spring: {}", userRegistry.getUserCount());
            log.info("WebSocket: - Sessão do usuário {}: {}", userId, connectedUsers.get(userId));
            
        } catch (Exception e) {
            log.error("WebSocket: 💥 Erro geral ao enviar notificação para usuário {}: {}", userId, e.getMessage(), e);
        }
    }

    /**
     * Envia uma notificação para todas as conexões WebSocket ativas (broadcast).
     *
     * @param eventName Nome do evento
     * @param message Mensagem de notificação
     */
    public void sendNotificationToAll(String eventName, NotificationMessage message) {
        log.info("WebSocket: 📢 Enviando broadcast '{}' para {} usuários conectados", 
                eventName, connectedUsers.size());
        log.debug("WebSocket: 📋 Conteúdo do broadcast: {}", message);
        
        try {
            String destination = "/topic/" + eventName;
            messagingTemplate.convertAndSend(destination, message);
            
            log.info("WebSocket: ✅ Broadcast '{}' enviado com sucesso para destino {}: {}", 
                    eventName, destination, message.getType());
                    
        } catch (Exception e) {
            log.error("WebSocket: ❌ Erro ao enviar broadcast '{}': {}", eventName, e.getMessage(), e);
        }
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
        log.info("WebSocket: 📨 Preparando notificação de nova mensagem para usuário {}", userId);
        log.info("WebSocket: 📋 Detalhes - Título: '{}', Tipo: '{}', ID: {}", messageTitle, messageType, messageId);
        
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
        
        log.info("WebSocket: 🚀 Enviando notificação de nova mensagem...");
        sendNotificationToUser(userId, "newMessage", notification);
        
        log.info("WebSocket: ✅ Notificação de nova mensagem processada para usuário {}: {}", userId, messageTitle);
    }

    /**
     * Envia uma notificação de atualização de dados (broadcast).
     *
     * @param message Mensagem da notificação
     * @param count Quantidade de registros afetados
     */
    public void sendDataUpdateNotification(String message, int count) {
        log.info("WebSocket: 🔄 Enviando notificação de atualização de dados: {} (count: {})", message, count);
        
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
        log.info("WebSocket: ❌ Enviando notificação de erro: {}", message);
        
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
        log.info("WebSocket: ℹ️ Enviando notificação informativa: {}", message);
        
        NotificationMessage notification = new NotificationMessage(
            "INFO",
            message,
            Map.of("timestamp", LocalDateTime.now())
        );
        sendNotificationToAll("info", notification);
    }

    /**
     * Envia mensagem de boas-vindas para um usuário recém-conectado.
     *
     * @param user Usuário que se conectou
     */
    public void sendWelcomeMessage(User user) {
        log.info("WebSocket: 👋 Enviando mensagem de boas-vindas para usuário {} (ID: {})", 
                user.getUsername(), user.getId());
        
        String welcomeMessage = messageService.getMessage("websocket.connection.established");
        NotificationMessage notification = new NotificationMessage(
            "CONNECTION",
            welcomeMessage,
            Map.of(
                "userId", user.getId(),
                "username", user.getUsername(),
                "timestamp", LocalDateTime.now()
            )
        );
        
        sendNotificationToUser(user.getId(), "connection", notification);
        log.info("WebSocket: ✅ Mensagem de boas-vindas enviada para usuário {}", user.getUsername());
    }

    /**
     * Obtém o número total de conexões WebSocket ativas.
     *
     * @return Número de conexões ativas
     */
    public int getActiveConnectionsCount() {
        int count = connectedUsers.size();
        log.debug("WebSocket: 📊 Contagem de conexões ativas: {}", count);
        return count;
    }

    /**
     * Verifica se um usuário específico está conectado.
     *
     * @param userId ID do usuário
     * @return true se o usuário está conectado
     */
    public boolean isUserConnected(Long userId) {
        boolean connected = connectedUsers.containsKey(userId);
        log.debug("WebSocket: 🔍 Usuário {} está conectado: {}", userId, connected);
        return connected;
    }

    /**
     * Obtém o número de conexões ativas para um usuário específico.
     * No WebSocket, cada usuário tem apenas uma conexão ativa por vez.
     *
     * @param userId ID do usuário
     * @return 1 se conectado, 0 se não conectado
     */
    public int getActiveConnectionsCountForUser(Long userId) {
        int count = connectedUsers.containsKey(userId) ? 1 : 0;
        log.debug("WebSocket: 📊 Conexões do usuário {}: {}", userId, count);
        return count;
    }

    /**
     * Obtém o número de usuários únicos com conexões ativas.
     *
     * @return Número de usuários conectados
     */
    public int getActiveUsersCount() {
        int count = connectedUsers.size();
        log.debug("WebSocket: 📊 Usuários únicos conectados: {}", count);
        return count;
    }

    /**
     * Obtém estatísticas detalhadas das conexões WebSocket.
     *
     * @return Mapa com estatísticas
     */
    public Map<String, Object> getConnectionStats() {
        Map<String, Object> stats = Map.of(
            "totalConnections", connectedUsers.size(),
            "activeUsers", connectedUsers.size(),
            "connectedUserIds", connectedUsers.keySet(),
            "registryUsers", userRegistry.getUserCount(),
            "userSessions", connectedUsers
        );
        
        log.debug("WebSocket: 📊 Estatísticas completas: {}", stats);
        return stats;
    }

    /**
     * Força desconexão de um usuário específico.
     *
     * @param userId ID do usuário
     */
    public void disconnectUser(Long userId) {
        log.info("WebSocket: 🔌 Forçando desconexão do usuário {}", userId);
        
        if (connectedUsers.containsKey(userId)) {
            // Enviar notificação de desconexão antes de remover
            NotificationMessage notification = new NotificationMessage(
                "DISCONNECT",
                "Conexão encerrada pelo servidor",
                Map.of("timestamp", LocalDateTime.now())
            );
            
            sendNotificationToUser(userId, "disconnect", notification);
            unregisterUserConnection(userId);
            
            log.info("WebSocket: ✅ Usuário {} foi desconectado pelo servidor", userId);
        } else {
            log.warn("WebSocket: ⚠️ Tentativa de desconectar usuário {} que não estava conectado", userId);
        }
    }
}