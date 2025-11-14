package com.example.ssedemo.controller;

import com.example.ssedemo.model.User;
import com.example.ssedemo.security.JwtTokenProvider;
import com.example.ssedemo.service.ExternalDataService;
import com.example.ssedemo.service.MessageService;
import com.example.ssedemo.service.SSENotificationService;
import com.example.ssedemo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Controller para gerenciamento de Server-Sent Events.
 * Suporta autenticação por usuário e notificações individuais.
 */
@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Server-Sent Events", description = "Endpoints para gerenciamento de notificações em tempo real via SSE")
@RequiredArgsConstructor
@Slf4j
public class SSEController {

    private final SSENotificationService notificationService;
    private final ExternalDataService externalDataService;
    private final MessageService messageService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;

    @Operation(
        summary = "Stream de notificações SSE autenticado", 
        description = "Estabelece uma conexão Server-Sent Events autenticada para receber notificações em tempo real. " +
                     "O usuário receberá notificações broadcast e notificações individuais de mensagens. " +
                     "A autenticação pode ser feita via header Authorization ou query parameter 'token'."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Conexão SSE estabelecida com sucesso",
                content = @Content(mediaType = "text/event-stream")),
        @ApiResponse(responseCode = "401", description = "Token JWT inválido ou expirado"),
        @ApiResponse(responseCode = "500", description = "Erro ao estabelecer conexão SSE")
    })
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(
            @Parameter(description = "Token JWT como query parameter (alternativa ao header Authorization)")
            @RequestParam(value = "token", required = false) String tokenParam,
            Authentication authentication) {
        
        User user = null;
        
        // Tentar obter usuário da autenticação padrão primeiro
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            user = (User) authentication.getPrincipal();
            log.info("SSE: Usuário autenticado via header: {}", user.getUsername());
        }
        // Se não há autenticação via header, tentar token como query parameter
        else if (tokenParam != null && !tokenParam.trim().isEmpty()) {
            try {
                if (jwtTokenProvider.validateToken(tokenParam)) {
                    Long userId = jwtTokenProvider.getUserIdFromToken(tokenParam);
                    user = userService.findById(userId)
                            .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + userId));
                    log.info("SSE: Usuário autenticado via token query param: {}", user.getUsername());
                } else {
                    log.warn("SSE: Token inválido fornecido como query parameter");
                    throw new RuntimeException("Token JWT inválido");
                }
            } catch (Exception e) {
                log.error("SSE: Erro ao validar token do query parameter: {}", e.getMessage());
                throw new RuntimeException("Erro na autenticação: " + e.getMessage());
            }
        }
        
        if (user == null) {
            log.error("SSE: Tentativa de conexão sem autenticação válida");
            throw new RuntimeException("Autenticação necessária para conexão SSE");
        }

        String connectionMessage = messageService.getSSEMessage("connection.established");
        log.info("SSE: Estabelecendo conexão autenticada para usuário: {} (ID: {})", 
                user.getUsername(), user.getId());
        
        return notificationService.createEmitterForUser(user);
    }

    @Operation(
        summary = "Stream de notificações SSE genérico (compatibilidade)", 
        description = "Estabelece uma conexão SSE genérica para broadcast apenas. " +
                     "Mantido para compatibilidade com código existente."
    )
    @GetMapping(value = "/stream/broadcast", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamBroadcastNotifications() {
        String connectionMessage = messageService.getSSEMessage("connection.established");
        log.info("SSE: Estabelecendo conexão broadcast genérica");
        return notificationService.createEmitter();
    }

    @Operation(
        summary = "Enviar notificação de teste", 
        description = "Envia uma notificação de teste para todas as conexões SSE ativas (broadcast)"
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
        
        String defaultMessage = messageService.getMessage("sse.test.notification.default");
        String userMessage = request.getOrDefault("message", defaultMessage);
        
        String testMessage = messageService.getSSEMessage("test.notification", userMessage);
        log.info("SSE: Enviando notificação de teste: {}", testMessage);
        
        notificationService.sendInfoNotification(userMessage);
        
        String responseMessage = messageService.getMessage("sse.test.notification.sent");
        
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
        
        // Apenas ADMIN pode enviar notificações para usuários específicos
        if (currentUser.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of(
                "status", "error",
                "message", "Apenas administradores podem enviar notificações para usuários específicos"
            ));
        }
        
        // Verificar se usuário de destino existe
        User targetUser = userService.findById(userId)
                .orElse(null);
        
        if (targetUser == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Usuário não encontrado: " + userId
            ));
        }
        
        String userMessage = request.getOrDefault("message", "Notificação de teste do administrador");
        
        notificationService.sendNewMessageNotification(
            userId,
            "Teste do Administrador",
            userMessage,
            "INFO",
            0L // ID fictício para teste
        );
        
        log.info("SSE: ADMIN {} enviou notificação de teste para usuário {} (ID: {})", 
                currentUser.getUsername(), targetUser.getUsername(), userId);
        
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Notificação de teste enviada para " + targetUser.getUsername(),
            "targetUser", targetUser.getUsername(),
            "userConnections", notificationService.getActiveConnectionsCountForUser(userId),
            "timestamp", LocalDateTime.now()
        ));
    }

    @Operation(
        summary = "Forçar busca de dados externos", 
        description = "Força uma busca manual de dados externos e envia notificação SSE broadcast com os resultados"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Busca executada com sucesso"),
        @ApiResponse(responseCode = "500", description = "Erro na busca de dados externos")
    })
    @PostMapping("/force-fetch")
    public ResponseEntity<Map<String, Object>> forceExternalDataFetch() {
        String fetchMessage = messageService.getMessage("external.data.fetch.forced");
        log.info("SSE: {}", fetchMessage);
        
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
            log.error("SSE: {}", errorMessage, e);
            
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", errorMessage,
                "error", e.getMessage(),
                "timestamp", LocalDateTime.now()
            ));
        }
    }

    @Operation(
        summary = "Status das conexões SSE", 
        description = "Retorna informações detalhadas sobre o status atual das conexões Server-Sent Events"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status retornado com sucesso")
    })
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSSEStatus() {
        Map<String, Object> connectionStats = notificationService.getConnectionStats();
        int activeConnections = notificationService.getActiveConnectionsCount();
        int activeUsers = notificationService.getActiveUsersCount();
        
        String statusMessage = messageService.getMessage("health.sse.active.connections", activeConnections);
        
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
        description = "Retorna informações sobre as conexões SSE do usuário autenticado"
    )
    @GetMapping("/status/user")
    public ResponseEntity<Map<String, Object>> getUserSSEStatus(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        int userConnections = notificationService.getActiveConnectionsCountForUser(currentUser.getId());
        
        return ResponseEntity.ok(Map.of(
            "userId", currentUser.getId(),
            "username", currentUser.getUsername(),
            "activeConnections", userConnections,
            "status", userConnections > 0 ? "connected" : "disconnected",
            "timestamp", LocalDateTime.now()
        ));
    }
}