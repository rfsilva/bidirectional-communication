package com.example.websocketdemo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

public class WebSocketInterceptor implements HandshakeInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketInterceptor.class);

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        
        logger.info("🤝 WebSocket handshake iniciado");
        logger.info("📍 URI: {}", request.getURI());
        logger.info("🌐 Origin: {}", request.getHeaders().getOrigin());
        logger.info("📋 Headers: {}", request.getHeaders());
        
        // Adicionar informações da sessão
        attributes.put("sessionId", System.currentTimeMillis());
        attributes.put("remoteAddress", request.getRemoteAddress());
        
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        
        if (exception != null) {
            logger.error("❌ Erro no handshake WebSocket: {}", exception.getMessage());
        } else {
            logger.info("✅ Handshake WebSocket concluído com sucesso");
        }
    }
}