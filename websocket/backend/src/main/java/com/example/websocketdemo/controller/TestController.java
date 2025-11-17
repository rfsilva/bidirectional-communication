package com.example.websocketdemo.controller;

import com.example.websocketdemo.model.User;
import com.example.websocketdemo.service.WebSocketNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Controller de teste para debug de WebSocket.
 */
@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
public class TestController {

    private final WebSocketNotificationService notificationService;

    /**
     * Endpoint simples para testar mensagens específicas de usuário.
     */
    @PostMapping("/message")
    public ResponseEntity<Map<String, Object>> sendTestMessage(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        
        log.info("🧪 TEST: Enviando mensagem de teste para usuário {} (ID: {})", 
                currentUser.getUsername(), currentUser.getId());
        
        // Verificar se usuário está conectado
        boolean isConnected = notificationService.isUserConnected(currentUser.getId());
        log.info("🔍 TEST: Status de conexão do usuário: {}", isConnected ? "CONECTADO" : "DESCONECTADO");
        
        if (!isConnected) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Usuário não está conectado via WebSocket",
                "userId", currentUser.getId(),
                "username", currentUser.getUsername()
            ));
        }
        
        // Enviar mensagem de teste
        notificationService.sendNewMessageNotification(
            currentUser.getId(),
            "🧪 Teste de Mensagem Específica",
            "Esta é uma mensagem de teste enviada especificamente para você!",
            "INFO",
            System.currentTimeMillis() // ID único baseado no timestamp
        );
        
        log.info("✅ TEST: Mensagem de teste enviada para usuário {} (ID: {})", 
                currentUser.getUsername(), currentUser.getId());
        
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Mensagem de teste enviada com sucesso",
            "userId", currentUser.getId(),
            "username", currentUser.getUsername(),
            "isConnected", isConnected,
            "timestamp", LocalDateTime.now()
        ));
    }

    /**
     * Endpoint para verificar status de conexão do usuário atual.
     */
    @GetMapping("/connection-status")
    public ResponseEntity<Map<String, Object>> getConnectionStatus(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        
        boolean isConnected = notificationService.isUserConnected(currentUser.getId());
        Map<String, Object> connectionStats = notificationService.getConnectionStats();
        
        log.info("📊 TEST: Status de conexão solicitado para usuário {} (ID: {}): {}", 
                currentUser.getUsername(), currentUser.getId(), isConnected ? "CONECTADO" : "DESCONECTADO");
        
        return ResponseEntity.ok(Map.of(
            "userId", currentUser.getId(),
            "username", currentUser.getUsername(),
            "isConnected", isConnected,
            "connectionStats", connectionStats,
            "timestamp", LocalDateTime.now()
        ));
    }
}