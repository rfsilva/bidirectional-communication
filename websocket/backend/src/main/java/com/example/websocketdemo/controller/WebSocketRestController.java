package com.example.websocketdemo.controller;

import com.example.websocketdemo.service.ExternalDataService;
import com.example.websocketdemo.service.WebSocketNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/websocket")
@Tag(name = "WebSocket Management", description = "Endpoints REST para gerenciamento de WebSocket")
public class WebSocketRestController {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketRestController.class);

    @Autowired
    private WebSocketNotificationService notificationService;

    @Autowired
    private ExternalDataService externalDataService;

    @Operation(
        summary = "Enviar notificação de teste via REST", 
        description = "Envia uma notificação de teste para todas as conexões WebSocket ativas via endpoint REST"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Notificação enviada com sucesso",
                content = @Content(mediaType = "application/json",
                    examples = @ExampleObject(value = """
                        {
                            "status": "success",
                            "message": "Notificação enviada via WebSocket",
                            "activeConnections": 2
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
        String message = request.getOrDefault("message", "Notificação de teste via REST");
        logger.info("Enviando notificação de teste via REST para WebSocket: {}", message);
        
        try {
            notificationService.sendInfoNotification(message);
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Notificação enviada via WebSocket",
                "activeConnections", notificationService.getActiveConnectionsCount()
            ));
        } catch (Exception e) {
            logger.error("Erro ao enviar notificação via WebSocket: {}", e.getMessage(), e);
            
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", "Erro ao enviar notificação via WebSocket",
                "error", e.getMessage()
            ));
        }
    }

    @Operation(
        summary = "Forçar busca de dados externos via REST", 
        description = "Força uma busca manual de dados externos e envia notificação WebSocket com os resultados"
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
        @ApiResponse(responseCode = "500", description = "Erro na busca de dados externos")
    })
    @PostMapping("/force-fetch")
    public ResponseEntity<Map<String, Object>> forceExternalDataFetch() {
        logger.info("Busca manual de dados externos solicitada via REST API");
        
        try {
            var newData = externalDataService.forceExternalDataFetch();
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Busca de dados externos executada",
                "recordsImported", newData.size()
            ));
            
        } catch (Exception e) {
            logger.error("Erro na busca manual via REST: {}", e.getMessage(), e);
            
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", "Erro ao buscar dados externos",
                "error", e.getMessage()
            ));
        }
    }

    @Operation(
        summary = "Status das conexões WebSocket", 
        description = "Retorna informações sobre o status atual das conexões WebSocket"
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
    public ResponseEntity<Map<String, Object>> getWebSocketStatus() {
        int activeConnections = notificationService.getActiveConnectionsCount();
        
        return ResponseEntity.ok(Map.of(
            "activeConnections", activeConnections,
            "status", activeConnections > 0 ? "active" : "inactive",
            "timestamp", java.time.LocalDateTime.now(),
            "type", "websocket"
        ));
    }
}