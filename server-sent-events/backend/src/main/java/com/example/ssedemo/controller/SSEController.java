package com.example.ssedemo.controller;

import com.example.ssedemo.service.ExternalDataService;
import com.example.ssedemo.service.MessageService;
import com.example.ssedemo.service.SSENotificationService;
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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Controller para gerenciamento de Server-Sent Events.
 * Utiliza Lombok e suporte a internacionalização.
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

    @Operation(
        summary = "Stream de notificações SSE", 
        description = "Estabelece uma conexão Server-Sent Events para receber notificações em tempo real. " +
                     "Esta conexão permanece aberta e envia eventos quando há atualizações de dados."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Conexão SSE estabelecida com sucesso",
                content = @Content(mediaType = "text/event-stream")),
        @ApiResponse(responseCode = "500", description = "Erro ao estabelecer conexão SSE")
    })
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications() {
        String connectionMessage = messageService.getSSEMessage("connection.established");
        log.info(connectionMessage);
        return notificationService.createEmitter();
    }

    @Operation(
        summary = "Enviar notificação de teste", 
        description = "Envia uma notificação de teste para todas as conexões SSE ativas"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Notificação enviada com sucesso",
                content = @Content(mediaType = "application/json",
                    examples = @ExampleObject(value = """
                        {
                            "status": "success",
                            "userMessage": "Notificação enviada",
                            "activeConnections": "2"
                        }
                        """))),
        @ApiResponse(responseCode = "500", description = "Erro ao enviar notificação")
    })
    @PostMapping("/test")
    public ResponseEntity<Map<String, String>> sendTestNotification(
            @Parameter(description = "Dados da notificação de teste", required = true,
                    content = @Content(examples = @ExampleObject(value = """
                        {
                            "userMessage": "Minha notificação de teste personalizada"
                        }
                        """)))
            @RequestBody Map<String, String> request) {
        
        // Usar método de conveniência para evitar warning de varargs
        String defaultMessage = messageService.getMessage("sse.test.notification.default");
        String userMessage = request.getOrDefault("userMessage", defaultMessage);
        
        String testMessage = messageService.getSSEMessage("test.notification", userMessage);
        log.info(testMessage);
        
        notificationService.sendInfoNotification(userMessage);
        
        String responseMessage = messageService.getMessage("sse.test.notification.sent");
        
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "userMessage", responseMessage,
            "activeConnections", String.valueOf(notificationService.getActiveConnectionsCount())
        ));
    }

    @Operation(
        summary = "Forçar busca de dados externos", 
        description = "Força uma busca manual de dados externos e envia notificação SSE com os resultados"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Busca executada com sucesso",
                content = @Content(mediaType = "application/json",
                    examples = @ExampleObject(value = """
                        {
                            "status": "success",
                            "userMessage": "Busca de dados externos executada",
                            "recordsImported": 3
                        }
                        """))),
        @ApiResponse(responseCode = "500", description = "Erro na busca de dados externos",
                content = @Content(mediaType = "application/json",
                    examples = @ExampleObject(value = """
                        {
                            "status": "error",
                            "userMessage": "Erro ao buscar dados externos",
                            "error": "Detalhes do erro"
                        }
                        """)))
    })
    @PostMapping("/force-fetch")
    public ResponseEntity<Map<String, Object>> forceExternalDataFetch() {
        String fetchMessage = messageService.getMessage("external.data.fetch.forced");
        log.info(fetchMessage);
        
        try {
            var newData = externalDataService.forceExternalDataFetch();
            String successMessage = messageService.getMessage("external.data.fetch.success");
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "userMessage", successMessage,
                "recordsImported", newData.size()
            ));
            
        } catch (Exception e) {
            String errorMessage = messageService.getMessage("external.data.fetch.error", e.getMessage());
            log.error(errorMessage, e);
            
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "userMessage", errorMessage,
                "error", e.getMessage()
            ));
        }
    }

    @Operation(
        summary = "Status das conexões SSE", 
        description = "Retorna informações sobre o status atual das conexões Server-Sent Events"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status retornado com sucesso",
                content = @Content(mediaType = "application/json",
                    examples = @ExampleObject(value = """
                        {
                            "activeConnections": 2,
                            "status": "active",
                            "timestamp": "2024-01-15T10:30:00"
                        }
                        """)))
    })
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSSEStatus() {
        int activeConnections = notificationService.getActiveConnectionsCount();
        String statusMessage = messageService.getMessage("health.sse.active.connections", activeConnections);
        
        return ResponseEntity.ok(Map.of(
            "activeConnections", activeConnections,
            "status", activeConnections > 0 ? "active" : "inactive",
            "statusMessage", statusMessage,
            "timestamp", LocalDateTime.now()
        ));
    }
}