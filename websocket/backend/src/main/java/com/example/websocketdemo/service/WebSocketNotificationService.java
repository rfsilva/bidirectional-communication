package com.example.websocketdemo.service;

import com.example.websocketdemo.model.NotificationMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class WebSocketNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketNotificationService.class);

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private SimpUserRegistry userRegistry;

    public void sendNotificationToAll(String destination, NotificationMessage message) {
        logger.info("Sending WebSocket notification to all clients: {}", message.getType());
        
        try {
            messagingTemplate.convertAndSend("/topic/" + destination, message);
            logger.info("WebSocket notification sent successfully. Active connections: {}", getActiveConnectionsCount());
        } catch (Exception e) {
            logger.error("Error sending WebSocket notification: {}", e.getMessage(), e);
        }
    }

    public void sendDataUpdateNotification(String message, int count) {
        NotificationMessage notification = new NotificationMessage(
            "DATA_UPDATE",
            message,
            Map.of(
                "count", count,
                "timestamp", LocalDateTime.now()
            )
        );
        sendNotificationToAll("notifications", notification);
    }

    public void sendErrorNotification(String message, String error) {
        NotificationMessage notification = new NotificationMessage(
            "ERROR",
            message,
            Map.of(
                "error", error,
                "timestamp", LocalDateTime.now()
            )
        );
        sendNotificationToAll("notifications", notification);
    }

    public void sendInfoNotification(String message) {
        NotificationMessage notification = new NotificationMessage(
            "INFO",
            message,
            Map.of(
                "timestamp", LocalDateTime.now()
            )
        );
        sendNotificationToAll("notifications", notification);
    }

    public void sendConnectionNotification(String message) {
        NotificationMessage notification = new NotificationMessage(
            "CONNECTION",
            message,
            Map.of(
                "timestamp", LocalDateTime.now(),
                "activeConnections", getActiveConnectionsCount()
            )
        );
        sendNotificationToAll("notifications", notification);
    }

    public int getActiveConnectionsCount() {
        return userRegistry.getUserCount();
    }

    // Método para enviar mensagem para usuário específico
    public void sendNotificationToUser(String username, String destination, NotificationMessage message) {
        logger.info("Sending WebSocket notification to user {}: {}", username, message.getType());
        
        try {
            messagingTemplate.convertAndSendToUser(username, "/queue/" + destination, message);
            logger.info("WebSocket notification sent to user {} successfully", username);
        } catch (Exception e) {
            logger.error("Error sending WebSocket notification to user {}: {}", username, e.getMessage(), e);
        }
    }
}