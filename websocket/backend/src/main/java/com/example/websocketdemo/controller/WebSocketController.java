package com.example.websocketdemo.controller;

import com.example.websocketdemo.model.NotificationMessage;
import com.example.websocketdemo.service.ExternalDataService;
import com.example.websocketdemo.service.WebSocketNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.Map;

@Controller
public class WebSocketController {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketController.class);

    @Autowired
    private WebSocketNotificationService notificationService;

    @Autowired
    private ExternalDataService externalDataService;

    @SubscribeMapping("/topic/notifications")
    public NotificationMessage handleSubscription() {
        logger.info("Nova subscrição WebSocket recebida");
        
        NotificationMessage welcomeMessage = new NotificationMessage(
            "CONNECTION",
            "Conectado ao WebSocket de notificações",
            Map.of(
                "timestamp", LocalDateTime.now(),
                "activeConnections", notificationService.getActiveConnectionsCount()
            )
        );
        
        return welcomeMessage;
    }

    @MessageMapping("/test")
    @SendTo("/topic/notifications")
    public NotificationMessage sendTestNotification(Map<String, String> request) {
        String message = request.getOrDefault("message", "Notificação de teste via WebSocket");
        logger.info("Enviando notificação de teste via WebSocket: {}", message);
        
        return new NotificationMessage(
            "INFO",
            message,
            Map.of(
                "timestamp", LocalDateTime.now(),
                "source", "websocket-test"
            )
        );
    }

    @MessageMapping("/force-fetch")
    @SendTo("/topic/notifications")
    public NotificationMessage forceExternalDataFetch() {
        logger.info("Busca manual de dados externos solicitada via WebSocket");
        
        try {
            var newData = externalDataService.forceExternalDataFetch();
            
            return new NotificationMessage(
                "DATA_UPDATE",
                String.format("Busca manual via WebSocket: importados %d registros", newData.size()),
                Map.of(
                    "recordsImported", newData.size(),
                    "timestamp", LocalDateTime.now(),
                    "source", "websocket-force-fetch"
                )
            );
            
        } catch (Exception e) {
            logger.error("Erro na busca manual via WebSocket: {}", e.getMessage(), e);
            
            return new NotificationMessage(
                "ERROR",
                "Erro na busca manual de dados externos via WebSocket",
                Map.of(
                    "error", e.getMessage(),
                    "timestamp", LocalDateTime.now(),
                    "source", "websocket-force-fetch"
                )
            );
        }
    }

    @MessageMapping("/ping")
    @SendTo("/topic/notifications")
    public NotificationMessage handlePing() {
        logger.debug("Ping recebido via WebSocket");
        
        return new NotificationMessage(
            "INFO",
            "Pong - WebSocket está ativo",
            Map.of(
                "timestamp", LocalDateTime.now(),
                "activeConnections", notificationService.getActiveConnectionsCount()
            )
        );
    }
}