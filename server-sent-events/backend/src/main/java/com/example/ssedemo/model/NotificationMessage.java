package com.example.ssedemo.model;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.Map;

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

    public NotificationMessage() {
        this.timestamp = LocalDateTime.now();
    }

    public NotificationMessage(String type, String message) {
        this();
        this.type = type;
        this.message = message;
    }

    public NotificationMessage(String type, String message, Map<String, Object> data) {
        this(type, message);
        this.data = data;
    }

    // Getters and Setters
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Map<String, Object> getData() {
        return data;
    }

    public void setData(Map<String, Object> data) {
        this.data = data;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "NotificationMessage{" +
                "type='" + type + '\'' +
                ", message='" + message + '\'' +
                ", data=" + data +
                ", timestamp=" + timestamp +
                '}';
    }
}