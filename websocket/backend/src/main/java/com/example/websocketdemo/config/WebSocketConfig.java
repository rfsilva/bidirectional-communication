package com.example.websocketdemo.config;

import com.example.websocketdemo.security.JwtTokenProvider;
import com.example.websocketdemo.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * Configuração do WebSocket para comunicação em tempo real.
 * Versão corrigida com mapeamento adequado de usuários.
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Habilita um broker simples em memória para enviar mensagens aos clientes
        config.enableSimpleBroker("/topic", "/queue");
        
        // Define o prefixo para mensagens destinadas ao servidor
        config.setApplicationDestinationPrefixes("/app");
        
        // Define prefixo para mensagens de usuário específico
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Registra o endpoint WebSocket com fallback SockJS
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Permitir todas as origens para desenvolvimento
                .addInterceptors(new JwtHandshakeInterceptor())
                .withSockJS(); // Fallback para navegadores que não suportam WebSocket nativo
        
        // Endpoint sem SockJS para clientes que suportam WebSocket nativo
        registry.addEndpoint("/ws-native")
                .setAllowedOriginPatterns("*")
                .addInterceptors(new JwtHandshakeInterceptor());
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Extrair informações do usuário durante a conexão STOMP
                    String token = accessor.getFirstNativeHeader("Authorization");
                    if (token != null && token.startsWith("Bearer ")) {
                        token = token.substring(7);
                    }
                    
                    // Se não tiver no header, tentar extrair dos parâmetros da sessão
                    if (token == null) {
                        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                        if (sessionAttributes != null) {
                            token = (String) sessionAttributes.get("token");
                        }
                    }
                    
                    if (token != null && jwtTokenProvider.validateToken(token)) {
                        try {
                            Long userId = jwtTokenProvider.getUserIdFromToken(token);
                            String username = jwtTokenProvider.getUsernameFromToken(token);
                            
                            // Criar um Principal personalizado com o ID do usuário
                            Principal userPrincipal = new UsernamePasswordAuthenticationToken(
                                userId.toString(), // Usar ID como nome do principal
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_USER"))
                            );
                            
                            accessor.setUser(userPrincipal);
                            
                            // Também armazenar nas sessões para acesso posterior
                            Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                            if (sessionAttributes != null) {
                                sessionAttributes.put("userId", userId);
                                sessionAttributes.put("username", username);
                            }
                            
                            log.info("WebSocket: 🔐 Usuário autenticado via STOMP: {} (ID: {})", username, userId);
                            
                        } catch (Exception e) {
                            log.error("WebSocket: ❌ Erro ao processar token JWT no STOMP: {}", e.getMessage());
                        }
                    } else {
                        log.warn("WebSocket: ⚠️ Token JWT inválido ou ausente no STOMP CONNECT");
                    }
                }
                
                return message;
            }
        });
    }

    /**
     * Interceptor para autenticação JWT durante o handshake do WebSocket.
     */
    private class JwtHandshakeInterceptor implements HandshakeInterceptor {

        @Override
        public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                     WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
            
            // Extrair token JWT dos parâmetros da query string
            String token = extractTokenFromRequest(request);
            
            if (token != null && jwtTokenProvider.validateToken(token)) {
                try {
                    Long userId = jwtTokenProvider.getUserIdFromToken(token);
                    String username = jwtTokenProvider.getUsernameFromToken(token);
                    
                    // Verificar se usuário existe
                    var user = userService.findById(userId);
                    if (user.isPresent()) {
                        // Armazenar informações do usuário nos atributos da sessão WebSocket
                        attributes.put("userId", userId);
                        attributes.put("username", username);
                        attributes.put("userRole", user.get().getRole().name());
                        attributes.put("token", token); // Armazenar token para uso posterior
                        
                        log.info("WebSocket: 🤝 Handshake autorizado para usuário {} (ID: {})", username, userId);
                        return true;
                    } else {
                        log.warn("WebSocket: ⚠️ Usuário não encontrado para ID: {}", userId);
                    }
                } catch (Exception e) {
                    log.error("WebSocket: ❌ Erro ao processar token JWT no handshake: {}", e.getMessage());
                }
            } else {
                log.warn("WebSocket: ⚠️ Token JWT inválido ou ausente no handshake");
            }
            
            log.warn("WebSocket: ❌ Handshake negado - autenticação falhou");
            return false; // Negar conexão se autenticação falhar
        }

        @Override
        public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                 WebSocketHandler wsHandler, Exception exception) {
            if (exception != null) {
                log.error("WebSocket: ❌ Erro após handshake: {}", exception.getMessage());
            } else {
                log.info("WebSocket: ✅ Handshake concluído com sucesso");
            }
        }

        /**
         * Extrai o token JWT da requisição.
         * Suporta tanto query parameter quanto header Authorization.
         */
        private String extractTokenFromRequest(ServerHttpRequest request) {
            // Tentar extrair do query parameter 'token'
            String query = request.getURI().getQuery();
            if (query != null) {
                String[] params = query.split("&");
                for (String param : params) {
                    if (param.startsWith("token=")) {
                        String token = param.substring(6); // Remove "token="
                        log.debug("WebSocket: 🔍 Token extraído do query parameter");
                        return token;
                    }
                }
            }
            
            // Tentar extrair do header Authorization
            var authHeaders = request.getHeaders().get("Authorization");
            if (authHeaders != null && !authHeaders.isEmpty()) {
                String authHeader = authHeaders.get(0);
                if (authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    log.debug("WebSocket: 🔍 Token extraído do header Authorization");
                    return token;
                }
            }
            
            log.debug("WebSocket: ⚠️ Nenhum token JWT encontrado na requisição");
            return null;
        }
    }
}