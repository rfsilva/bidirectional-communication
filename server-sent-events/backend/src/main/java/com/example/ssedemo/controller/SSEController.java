package com.example.ssedemo.controller;

import com.example.ssedemo.service.ExternalDataService;
import com.example.ssedemo.service.SSENotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class SSEController {

    private static final Logger logger = LoggerFactory.getLogger(SSEController.class);

    @Autowired
    private SSENotificationService notificationService;

    @Autowired
    private ExternalDataService externalDataService;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications() {
        logger.info("Nova conexão SSE solicitada");
        return notificationService.createEmitter();
    }

    @PostMapping("/test")
    public ResponseEntity<Map<String, String>> sendTestNotification(@RequestBody Map<String, String> request) {
        String message = request.getOrDefault("message", "Notificação de teste");
        logger.info("Enviando notificação de teste: {}", message);
        
        notificationService.sendInfoNotification(message);
        
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Notificação enviada",
            "activeConnections", String.valueOf(notificationService.getActiveConnectionsCount())
        ));
    }

    @PostMapping("/force-fetch")
    public ResponseEntity<Map<String, Object>> forceExternalDataFetch() {
        logger.info("Busca manual de dados externos solicitada via API");
        
        try {
            var newData = externalDataService.forceExternalDataFetch();
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Busca de dados externos executada",
                "recordsImported", newData.size()
            ));
            
        } catch (Exception e) {
            logger.error("Erro na busca manual: {}", e.getMessage(), e);
            
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", "Erro ao buscar dados externos",
                "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSSEStatus() {
        int activeConnections = notificationService.getActiveConnectionsCount();
        
        return ResponseEntity.ok(Map.of(
            "activeConnections", activeConnections,
            "status", activeConnections > 0 ? "active" : "inactive",
            "timestamp", java.time.LocalDateTime.now()
        ));
    }
}