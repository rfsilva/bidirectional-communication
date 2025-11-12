package com.example.websocketdemo.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class SockJsFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(SockJsFilter.class);

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        String requestURI = httpRequest.getRequestURI();
        String method = httpRequest.getMethod();
        
        // Interceptar requisições GET diretas para /ws
        if ("/ws".equals(requestURI) && "GET".equals(method)) {
            String queryString = httpRequest.getQueryString();
            
            // Se não tem parâmetros, é uma requisição direta inválida
            if (queryString == null || queryString.isEmpty()) {
                logger.info("🚫 Interceptando requisição GET direta para /ws - redirecionando para /ws/info");
                
                // Redirecionar para o endpoint de informações
                httpResponse.setStatus(HttpServletResponse.SC_MOVED_PERMANENTLY);
                httpResponse.setHeader("Location", "/ws/info");
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write(
                    "{\"error\":\"Direct access not allowed\",\"message\":\"Use SockJS client\",\"redirect\":\"/ws/info\"}"
                );
                return;
            }
        }
        
        // Continuar com a requisição normal
        chain.doFilter(request, response);
    }
}