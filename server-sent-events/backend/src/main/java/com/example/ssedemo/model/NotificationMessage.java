package com.example.ssedemo.model;

import java.time.LocalDateTime;
import java.util.Map;

public class NotificationMessage {
    private String type;
    private String message;
    private Map<String, Object> data;
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