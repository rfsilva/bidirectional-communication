package com.example.websocketdemo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Aplicação principal do WebSocket Demo.
 * 
 * Esta aplicação demonstra o uso de WebSockets para comunicação em tempo real
 * entre backend e frontend, substituindo o Server-Sent Events (SSE).
 */
@SpringBootApplication
@EnableScheduling
public class WebSocketDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(WebSocketDemoApplication.class, args);
    }
}
