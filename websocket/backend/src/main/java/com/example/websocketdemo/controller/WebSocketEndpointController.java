package com.example.websocketdemo.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/ws")
public class WebSocketEndpointController {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEndpointController.class);

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> sockJsInfo() {
        logger.info("📋 Fornecendo informações SockJS via /ws/info");
        
        return ResponseEntity.ok(Map.of(
            "websocket", true,
            "origins", new String[]{"*:*"},
            "cookie_needed", false,
            "entropy", System.currentTimeMillis(),
            "timestamp", LocalDateTime.now(),
            "message", "SockJS endpoint is working"
        ));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> handleDirectAccess(
            @RequestParam(required = false) Map<String, String> params) {
        
        // Se tem parâmetros, pode ser uma requisição SockJS válida - deixar passar
        if (params != null && !params.isEmpty()) {
            logger.debug("🔄 Requisição /ws com parâmetros: {}", params);
            // Retornar erro 400 para que o SockJS processe normalmente
            return ResponseEntity.badRequest().body(Map.of(
                "message", "SockJS transport request",
                "params", params
            ));
        }
        
        // Requisição direta sem parâmetros
        logger.warn("🚫 Acesso direto ao endpoint /ws detectado");
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
            "error", "Direct access to WebSocket endpoint not allowed",
            "message", "Use SockJS client to connect: new SockJS('http://localhost:8080/ws')",
            "info_endpoint", "/ws/info",
            "correct_usage", "Connect using STOMP over SockJS",
            "documentation", "See test-sockjs-simple.html for examples",
            "timestamp", LocalDateTime.now()
        ));
    }
}