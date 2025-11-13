package com.example.ssedemo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Classe principal da aplicação SSE Demo.
 * 
 * Esta aplicação demonstra o uso de Server-Sent Events com Spring Boot 3,
 * incluindo suporte a Lombok e internacionalização (I18N) para múltiplos idiomas.
 * 
 * Funcionalidades principais:
 * - CRUD de dados com notificações em tempo real via SSE
 * - Simulação de dados externos com agendamento automático
 * - Suporte a internacionalização (pt, en, es, it)
 * - Documentação automática com OpenAPI/Swagger
 * - Uso de Lombok para redução de boilerplate code
 */
@SpringBootApplication
@EnableScheduling
public class SseDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(SseDemoApplication.class, args);
    }
}