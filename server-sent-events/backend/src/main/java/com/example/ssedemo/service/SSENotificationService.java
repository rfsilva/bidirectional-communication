package com.example.ssedemo.service;

import com.example.ssedemo.model.NotificationMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SSENotificationService {

    private static final Logger logger = LoggerFactory.getLogger(SSENotificationService.class);
    private final Set<SseEmitter> emitters = Collections.newSetFromMap(new ConcurrentHashMap<>());
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SseEmitter createEmitter() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        
        emitter.onCompletion(() -> {
            logger.info("SSE connection completed");
            emitters.remove(emitter);
        });
        
        emitter.onTimeout(() -> {
            logger.info("SSE connection timed out");
            emitters.remove(emitter);
        });
        
        emitter.onError((ex) -> {
            logger.error("SSE connection error: {}", ex.getMessage());
            emitters.remove(emitter);
        });

        emitters.add(emitter);
        logger.info("New SSE connection established. Total connections: {}", emitters.size());

        // Enviar mensagem de boas-vindas
        try {
            NotificationMessage welcomeMessage = new NotificationMessage(
                "CONNECTION", 
                "Conectado ao stream de notificações"
            );
            emitter.send(SseEmitter.event()
                .name("connection")
                .data(objectMapper.writeValueAsString(welcomeMessage))
                .id(String.valueOf(System.currentTimeMillis())));
        } catch (IOException e) {
            logger.error("Error sending welcome message: {}", e.getMessage());
            emitters.remove(emitter);
        }

        return emitter;
    }

    public void sendNotificationToAll(String eventName, NotificationMessage message) {
        if (emitters.isEmpty()) {
            logger.debug("No SSE connections available to send notification");
            return;
        }

        logger.info("Sending notification to {} connections: {}", emitters.size(), message.getType());

        emitters.removeIf(emitter -> {
            try {
                String jsonData = objectMapper.writeValueAsString(message);
                emitter.send(SseEmitter.event()
                    .name(eventName)
                    .data(jsonData)
                    .id(String.valueOf(System.currentTimeMillis())));
                return false; // Keep emitter
            } catch (IOException e) {
                logger.warn("Failed to send notification to client: {}", e.getMessage());
                return true; // Remove emitter
            }
        });

        logger.info("Notification sent. Active connections: {}", emitters.size());
    }

    public void sendDataUpdateNotification(String message, int count) {
        NotificationMessage notification = new NotificationMessage(
            "DATA_UPDATE",
            message,
            java.util.Map.of(
                "count", count,
                "timestamp", java.time.LocalDateTime.now()
            )
        );
        sendNotificationToAll("dataUpdate", notification);
    }

    public void sendErrorNotification(String message, String error) {
        NotificationMessage notification = new NotificationMessage(
            "ERROR",
            message,
            java.util.Map.of(
                "error", error,
                "timestamp", java.time.LocalDateTime.now()
            )
        );
        sendNotificationToAll("error", notification);
    }

    public void sendInfoNotification(String message) {
        NotificationMessage notification = new NotificationMessage(
            "INFO",
            message
        );
        sendNotificationToAll("info", notification);
    }

    public int getActiveConnectionsCount() {
        return emitters.size();
    }
}