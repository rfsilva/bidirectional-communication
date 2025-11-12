package com.example.websocketdemo.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@Tag(name = "WebSocket Debug", description = "Endpoints para debug e teste de WebSocket")
public class WebSocketDebugController {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketDebugController.class);

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private SimpUserRegistry userRegistry;

    @Operation(summary = "Informações de debug do WebSocket")
    @ApiResponse(responseCode = "200", description = "Informações retornadas com sucesso")
    @GetMapping("/websocket-info")
    public ResponseEntity<Map<String, Object>> getWebSocketInfo() {
        return ResponseEntity.ok(Map.of(
            "activeUsers", userRegistry.getUserCount(),
            "userNames", userRegistry.findSubscriptions(s -> true).size(),
            "timestamp", LocalDateTime.now(),
            "status", "WebSocket Debug Info"
        ));
    }

    @Operation(summary = "Enviar mensagem de teste via template")
    @ApiResponse(responseCode = "200", description = "Mensagem enviada com sucesso")
    @PostMapping("/send-test")
    public ResponseEntity<Map<String, Object>> sendTestMessage() {
        try {
            Map<String, Object> testMessage = Map.of(
                "type", "DEBUG",
                "message", "Mensagem de teste via SimpMessagingTemplate",
                "timestamp", LocalDateTime.now(),
                "source", "debug-controller"
            );

            messagingTemplate.convertAndSend("/topic/notifications", testMessage);

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Mensagem de teste enviada",
                "activeUsers", userRegistry.getUserCount()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", "Erro ao enviar mensagem",
                "error", e.getMessage()
            ));
        }
    }

    @Operation(summary = "Debug de requisição HTTP")
    @GetMapping("/request-info")
    public ResponseEntity<Map<String, Object>> getRequestInfo(HttpServletRequest request) {
        Map<String, Object> info = new HashMap<>();
        
        info.put("method", request.getMethod());
        info.put("requestURI", request.getRequestURI());
        info.put("queryString", request.getQueryString());
        info.put("remoteAddr", request.getRemoteAddr());
        info.put("remoteHost", request.getRemoteHost());
        info.put("serverName", request.getServerName());
        info.put("serverPort", request.getServerPort());
        
        Map<String, String> headers = new HashMap<>();
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            headers.put(headerName, request.getHeader(headerName));
        }
        info.put("headers", headers);
        
        return ResponseEntity.ok(info);
    }

    @Operation(summary = "Simular requisição problemática")
    @GetMapping("/simulate-ws-request")
    public ResponseEntity<Map<String, Object>> simulateWsRequest() {
        logger.info("🔍 Simulando requisição problemática para /ws");
        
        try {
            // Simular o que acontece quando alguém acessa /ws diretamente
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Direct access to /ws endpoint",
                "message", "Use SockJS client to connect to WebSocket",
                "correctUsage", "new SockJS('http://localhost:8080/ws')",
                "timestamp", LocalDateTime.now()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "error", e.getMessage(),
                "timestamp", LocalDateTime.now()
            ));
        }
    }
}