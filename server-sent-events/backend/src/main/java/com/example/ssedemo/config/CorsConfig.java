package com.example.ssedemo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuração de CORS para permitir requisições do frontend.
 */
@Configuration
public class CorsConfig {

    /**
     * Configura as regras de CORS para a aplicação.
     *
     * @return WebMvcConfigurer com configurações de CORS
     */
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:4200")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .exposedHeaders("Content-Type", "Cache-Control", "Connection")
                        .maxAge(3600); // Cache preflight por 1 hora
            }
        };
    }
}