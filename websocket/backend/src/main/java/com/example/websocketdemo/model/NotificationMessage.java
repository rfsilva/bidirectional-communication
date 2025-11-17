package com.example.websocketdemo.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Mensagem de notificação enviada via Server-Sent Events.
 * Utiliza Lombok para reduzir boilerplate code.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Mensagem de notificação enviada via Server-Sent Events")
public class NotificationMessage {
    
    @Schema(description = "Tipo da notificação", 
            example = "DATA_UPDATE", 
            allowableValues = {"CONNECTION", "DATA_UPDATE", "ERROR", "INFO"})
    private String type;
    
    @Schema(description = "Mensagem descritiva da notificação", 
            example = "Novo registro criado: Produto A")
    private String message;
    
    @Schema(description = "Dados adicionais da notificação", 
            example = "{\"count\": 1, \"timestamp\": \"2024-01-15T10:30:00\"}")
    private Map<String, Object> data;
    
    @Schema(description = "Timestamp da notificação", 
            example = "2024-01-15T10:30:00")
    private LocalDateTime timestamp;

    /**
     * Construtor para criar uma notificação com tipo e mensagem.
     *
     * @param type Tipo da notificação
     * @param message Mensagem da notificação
     */
    public NotificationMessage(String type, String message) {
        this.type = type;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

    /**
     * Construtor para criar uma notificação com tipo, mensagem e dados.
     *
     * @param type Tipo da notificação
     * @param message Mensagem da notificação
     * @param data Dados adicionais
     */
    public NotificationMessage(String type, String message, Map<String, Object> data) {
        this.type = type;
        this.message = message;
        this.data = data;
        this.timestamp = LocalDateTime.now();
    }
}