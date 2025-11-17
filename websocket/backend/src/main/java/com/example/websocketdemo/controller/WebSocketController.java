package com.example.websocketdemo.controller;

import com.example.websocketdemo.model.User;
import com.example.websocketdemo.service.ExternalDataService;
import com.example.websocketdemo.service.MessageService;
import com.example.websocketdemo.service.UserService;
import com.example.websocketdemo.service.WebSocketNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Controller para gerenciamento de WebSocket.
 * Versão corrigida para resolver problemas de variáveis final/effectively final.
 */
@Controller
@RestController
@RequestMapping("/api/notifications")
@Tag(name = "WebSocket", description = "Endpoints para gerenciamento de notificações em tempo real via WebSocket")
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    private final WebSocketNotificationService notificationService;
    private final ExternalDataService externalDataService;
    private final MessageService messageService;
    private final UserService userService;

    /**
     * Manipula conexões WebSocket quando um usuário se conecta.
     */
    @MessageMapping("/connect")
    public void handleConnect(@Payload Map<String, Object> payload, SimpMessageHeaderAccessor headerAccessor) {
        log.info("WebSocket: Processando conexão - payload: {}", payload);
        log.info("WebSocket: Headers da sessão: {}", headerAccessor.getSessionAttributes());
        
        // Extrair informações do usuário dos atributos da sessão (definidos no handshake)
        Long userIdFromSession = (Long) headerAccessor.getSessionAttributes().get("userId");
        String usernameFromSession = (String) headerAccessor.getSessionAttributes().get("username");
        final String sessionId = headerAccessor.getSessionId();
        
        // Determinar userId final
        Long tempUserId = userIdFromSession;
        if (tempUserId == null && payload.containsKey("userId")) {
            try {
                tempUserId = Long.valueOf(payload.get("userId").toString());
                log.info("WebSocket: UserId extraído do payload: {}", tempUserId);
            } catch (Exception e) {
                log.warn("WebSocket: Erro ao extrair userId do payload: {}", e.getMessage());
                tempUserId = null;
            }
        }
        final Long finalUserId = tempUserId;
        
        // Determinar username final
        String tempUsername = usernameFromSession;
        if (tempUsername == null && payload.containsKey("username")) {
            tempUsername = payload.get("username").toString();
            log.info("WebSocket: Username extraído do payload: {}", tempUsername);
        }
        final String finalUsername = tempUsername;
        
        log.info("WebSocket: Dados da conexão - UserId: {}, Username: {}, SessionId: {}", 
                finalUserId, finalUsername, sessionId);
        
        if (finalUserId != null && finalUsername != null) {
            // Registrar usuário como conectado
            notificationService.registerUserConnection(finalUserId, sessionId);
            
            // Buscar usuário completo e enviar mensagem de boas-vindas
            userService.findById(finalUserId).ifPresentOrElse(
                user -> {
                    notificationService.sendWelcomeMessage(user);
                    log.info("WebSocket: ✅ Usuário {} (ID: {}) conectado com sucesso na sessão {}", 
                            finalUsername, finalUserId, sessionId);
                },
                () -> {
                    log.warn("WebSocket: ⚠️ Usuário com ID {} não encontrado no banco de dados", finalUserId);
                }
            );
        } else {
            log.warn("WebSocket: ❌ Tentativa de conexão sem informações de usuário válidas - UserId: {}, Username: {}", 
                    finalUserId, finalUsername);
        }
    }

    /**
     * Manipula desconexões WebSocket.
     */
    @MessageMapping("/disconnect")
    public void handleDisconnect(@Payload Map<String, Object> payload, SimpMessageHeaderAccessor headerAccessor) {
        Long userIdFromSession = (Long) headerAccessor.getSessionAttributes().get("userId");
        String usernameFromSession = (String) headerAccessor.getSessionAttributes().get("username");
        String sessionId = headerAccessor.getSessionId();
        
        // Determinar userId final
        Long finalUserId = userIdFromSession;
        if (finalUserId == null && payload.containsKey("userId")) {
            try {
                finalUserId = Long.valueOf(payload.get("userId").toString());
            } catch (Exception e) {
                log.warn("WebSocket: Erro ao extrair userId do payload na desconexão: {}", e.getMessage());
            }
        }
        
        log.info("WebSocket: Processando desconexão - UserId: {}, Username: {}, SessionId: {}", 
                finalUserId, usernameFromSession, sessionId);
        
        if (finalUserId != null) {
            notificationService.unregisterUserConnection(finalUserId);
            log.info("WebSocket: ✅ Usuário {} (ID: {}) desconectado da sessão {}", usernameFromSession, finalUserId, sessionId);
        } else {
            log.warn("WebSocket: ⚠️ Desconexão sem userId válido");
        }
    }

    /**
     * Manipula mensagens de ping/keepalive do cliente.
     */
    @MessageMapping("/ping")
    public void handlePing(@Payload Map<String, Object> payload, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        
        if (userId != null) {
            log.debug("WebSocket: 🏓 Ping recebido do usuário {} (ID: {})", username, userId);
            
            // Responder com pong (opcional - pode ser implementado se necessário)
            Map<String, Object> pongResponse = Map.of(
                "type", "pong",
                "timestamp", LocalDateTime.now(),
                "clientTimestamp", payload.get("timestamp"),
                "userId", userId
            );
            
            // Enviar pong de volta para o usuário
            notificationService.sendNotificationToUser(userId, "pong", 
                new com.example.websocketdemo.model.NotificationMessage(
                    "PONG", 
                    "Pong response", 
                    pongResponse
                )
            );
            
            log.debug("WebSocket: 🏓 Pong enviado para usuário {} (ID: {})", username, userId);
        } else {
            log.warn("WebSocket: ⚠️ Ping recebido sem userId válido");
        }
    }

    @Operation(
        summary = "Enviar notificação de teste", 
        description = "Envia uma notificação de teste para todas as conexões WebSocket ativas (broadcast)"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Notificação enviada com sucesso",
                content = @Content(mediaType = "application/json",
                    examples = @ExampleObject(value = """
                        {
                            "status": "success",
                            "message": "Notificação enviada",
                            "activeConnections": "2",
                            "activeUsers": "1"
                        }
                        """))),
        @ApiResponse(responseCode = "500", description = "Erro ao enviar notificação")
    })
    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> sendTestNotification(
            @Parameter(description = "Dados da notificação de teste", required = true,
                    content = @Content(examples = @ExampleObject(value = """
                        {
                            "message": "Minha notificação de teste personalizada"
                        }
                        """)))
            @RequestBody Map<String, String> request) {
        
        String defaultMessage = messageService.getMessage("websocket.test.notification.default");
        String userMessage = request.getOrDefault("message", defaultMessage);
        
        String testMessage = messageService.getMessage("websocket.test.notification", userMessage);
        log.info("WebSocket: 📢 Enviando notificação de teste broadcast: {}", testMessage);
        
        notificationService.sendInfoNotification(userMessage);
        
        String responseMessage = messageService.getMessage("websocket.test.notification.sent");
        
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", responseMessage,
            "activeConnections", notificationService.getActiveConnectionsCount(),
            "activeUsers", notificationService.getActiveUsersCount(),
            "timestamp", LocalDateTime.now()
        ));
    }

    @Operation(
        summary = "Enviar notificação de teste para usuário específico", 
        description = "Envia uma notificação de teste para um usuário específico (apenas ADMIN)"
    )
    @PostMapping("/test/user/{userId}")
    public ResponseEntity<Map<String, Object>> sendTestNotificationToUser(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        
        log.info("WebSocket: 🧪 ADMIN {} solicitando teste de notificação para usuário ID: {}", 
                currentUser.getUsername(), userId);
        
        // Apenas ADMIN pode enviar notificações para usuários específicos
        if (currentUser.getRole() != User.Role.ADMIN) {
            log.warn("WebSocket: ❌ Usuário {} tentou enviar notificação específica sem permissão", 
                    currentUser.getUsername());
            return ResponseEntity.status(403).body(Map.of(
                "status", "error",
                "message", "Apenas administradores podem enviar notificações para usuários específicos"
            ));
        }
        
        // Verificar se usuário de destino existe
        User targetUser = userService.findById(userId).orElse(null);
        
        if (targetUser == null) {
            log.warn("WebSocket: ❌ Usuário de destino não encontrado: {}", userId);
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Usuário não encontrado: " + userId
            ));
        }
        
        // Verificar se usuário está conectado
        boolean isConnected = notificationService.isUserConnected(userId);
        log.info("WebSocket: 🔍 Status do usuário {} (ID: {}): {}", 
                targetUser.getUsername(), userId, isConnected ? "CONECTADO" : "DESCONECTADO");
        
        String userMessage = request.getOrDefault("message", "Notificação de teste do administrador");
        
        // Enviar notificação
        notificationService.sendNewMessageNotification(
            userId,
            "🧪 Teste do Administrador",
            userMessage,
            "INFO",
            999L // ID fictício para teste
        );
        
        log.info("WebSocket: ✅ ADMIN {} enviou notificação de teste para usuário {} (ID: {}) - Conectado: {}", 
                currentUser.getUsername(), targetUser.getUsername(), userId, isConnected);
        
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Notificação de teste enviada para " + targetUser.getUsername(),
            "targetUser", targetUser.getUsername(),
            "targetUserId", userId,
            "userConnected", isConnected,
            "activeConnections", notificationService.getActiveConnectionsCount(),
            "connectionStats", notificationService.getConnectionStats(),
            "timestamp", LocalDateTime.now()
        ));
    }

    @Operation(
        summary = "Forçar busca de dados externos", 
        description = "Força uma busca manual de dados externos e envia notificação WebSocket broadcast com os resultados"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Busca executada com sucesso"),
        @ApiResponse(responseCode = "500", description = "Erro na busca de dados externos")
    })
    @PostMapping("/force-fetch")
    public ResponseEntity<Map<String, Object>> forceExternalDataFetch() {
        String fetchMessage = messageService.getMessage("external.data.fetch.forced");
        log.info("WebSocket: {}", fetchMessage);
        
        try {
            var newData = externalDataService.forceExternalDataFetch();
            String successMessage = messageService.getMessage("external.data.fetch.success");
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", successMessage,
                "recordsImported", newData.size(),
                "timestamp", LocalDateTime.now()
            ));
            
        } catch (Exception e) {
            String errorMessage = messageService.getMessage("external.data.fetch.error", e.getMessage());
            log.error("WebSocket: {}", errorMessage, e);
            
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", errorMessage,
                "error", e.getMessage(),
                "timestamp", LocalDateTime.now()
            ));
        }
    }

    @Operation(
        summary = "Status das conexões WebSocket", 
        description = "Retorna informações detalhadas sobre o status atual das conexões WebSocket"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status retornado com sucesso")
    })
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getWebSocketStatus() {
        Map<String, Object> connectionStats = notificationService.getConnectionStats();
        int activeConnections = notificationService.getActiveConnectionsCount();
        int activeUsers = notificationService.getActiveUsersCount();
        
        String statusMessage = messageService.getMessage("health.websocket.active.connections", activeConnections);
        
        log.info("WebSocket: 📊 Status solicitado - Conexões: {}, Usuários: {}", activeConnections, activeUsers);
        
        return ResponseEntity.ok(Map.of(
            "activeConnections", activeConnections,
            "activeUsers", activeUsers,
            "status", activeConnections > 0 ? "active" : "inactive",
            "statusMessage", statusMessage,
            "connectionStats", connectionStats,
            "timestamp", LocalDateTime.now()
        ));
    }

    @Operation(
        summary = "Status das conexões do usuário atual", 
        description = "Retorna informações sobre as conexões WebSocket do usuário autenticado"
    )
    @GetMapping("/status/user")
    public ResponseEntity<Map<String, Object>> getUserWebSocketStatus(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        boolean isConnected = notificationService.isUserConnected(currentUser.getId());
        
        log.info("WebSocket: 👤 Status do usuário {} (ID: {}): {}", 
                currentUser.getUsername(), currentUser.getId(), isConnected ? "CONECTADO" : "DESCONECTADO");
        
        return ResponseEntity.ok(Map.of(
            "userId", currentUser.getId(),
            "username", currentUser.getUsername(),
            "connected", isConnected,
            "status", isConnected ? "connected" : "disconnected",
            "timestamp", LocalDateTime.now()
        ));
    }

    @Operation(
        summary = "Desconectar usuário específico", 
        description = "Força a desconexão de um usuário específico (apenas ADMIN)"
    )
    @PostMapping("/disconnect/user/{userId}")
    public ResponseEntity<Map<String, Object>> disconnectUser(
            @PathVariable Long userId,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        
        // Apenas ADMIN pode desconectar outros usuários
        if (currentUser.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of(
                "status", "error",
                "message", "Apenas administradores podem desconectar usuários"
            ));
        }
        
        // Verificar se usuário existe
        User targetUser = userService.findById(userId).orElse(null);
        if (targetUser == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Usuário não encontrado: " + userId
            ));
        }
        
        boolean wasConnected = notificationService.isUserConnected(userId);
        if (wasConnected) {
            notificationService.disconnectUser(userId);
            log.info("WebSocket: 🔌 ADMIN {} desconectou usuário {} (ID: {})", 
                    currentUser.getUsername(), targetUser.getUsername(), userId);
        }
        
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", wasConnected ? 
                "Usuário " + targetUser.getUsername() + " foi desconectado" :
                "Usuário " + targetUser.getUsername() + " não estava conectado",
            "targetUser", targetUser.getUsername(),
            "wasConnected", wasConnected,
            "timestamp", LocalDateTime.now()
        ));
    }
}