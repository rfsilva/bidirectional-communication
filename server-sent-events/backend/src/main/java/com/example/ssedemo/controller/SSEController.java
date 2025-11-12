package com.example.ssedemo.controller;

import com.example.ssedemo.service.ExternalDataService;
import com.example.ssedemo.service.SSENotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Server-Sent Events", description = "Endpoints para gerenciamento de notificações em tempo real via SSE")
public class SSEController {

    private static final Logger logger = LoggerFactory.getLogger(SSEController.class);

    @Autowired
    private SSENotificationService notificationService;

    @Autowired
    private ExternalDataService externalDataService;

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
        logger.info("Nova conexão SSE solicitada");
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
                            "message": "Notificação enviada",
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
                            "message": "Minha notificação de teste personalizada"
                        }
                        """)))
            @RequestBody Map<String, String> request) {
        String message = request.getOrDefault("message", "Notificação de teste");
        logger.info("Enviando notificação de teste: {}", message);
        
        notificationService.sendInfoNotification(message);
        
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Notificação enviada",
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
                            "message": "Busca de dados externos executada",
                            "recordsImported": 3
                        }
                        """))),
        @ApiResponse(responseCode = "500", description = "Erro na busca de dados externos",
                content = @Content(mediaType = "application/json",
                    examples = @ExampleObject(value = """
                        {
                            "status": "error",
                            "message": "Erro ao buscar dados externos",
                            "error": "Detalhes do erro"
                        }
                        """)))
    })
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
        
        return ResponseEntity.ok(Map.of(
            "activeConnections", activeConnections,
            "status", activeConnections > 0 ? "active" : "inactive",
            "timestamp", java.time.LocalDateTime.now()
        ));
    }
}