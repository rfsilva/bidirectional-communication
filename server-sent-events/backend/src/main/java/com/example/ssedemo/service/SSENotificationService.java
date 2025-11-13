package com.example.ssedemo.service;

import com.example.ssedemo.model.NotificationMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Serviço para gerenciamento de notificações Server-Sent Events.
 * Utiliza Lombok para reduzir boilerplate code.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SSENotificationService {

    private final Set<SseEmitter> emitters = Collections.newSetFromMap(new ConcurrentHashMap<>());
    private final ObjectMapper objectMapper;
    private final MessageService messageService;

    /**
     * Cria um novo emitter SSE e o registra na lista de conexões ativas.
     *
     * @return Novo SseEmitter configurado
     */
    public SseEmitter createEmitter() {
        SseEmitter emitter = new SseEmitter(0L); // Timeout infinito
        
        emitter.onCompletion(() -> {
            String completionMessage = messageService.getSSEMessage("connection.completed", "SSE connection completed");
            log.info(completionMessage);
            emitters.remove(emitter);
        });
        
        emitter.onTimeout(() -> {
            String timeoutMessage = messageService.getSSEMessage("connection.timeout", "SSE connection timed out");
            log.info(timeoutMessage);
            emitters.remove(emitter);
        });
        
        emitter.onError((ex) -> {
            String errorMessage = messageService.getSSEMessage("connection.error", "SSE connection error: {0}");
            log.error(errorMessage, ex.getMessage());
            emitters.remove(emitter);
        });

        emitters.add(emitter);
        log.info("Nova conexão SSE estabelecida. Total de conexões: {}", emitters.size());

        // Enviar mensagem de boas-vindas
        try {
            String welcomeMessage = messageService.getSSEMessage("connection.established");
            NotificationMessage notification = new NotificationMessage(
                "CONNECTION", 
                welcomeMessage
            );
            emitter.send(SseEmitter.event()
                .name("connection")
                .data(objectMapper.writeValueAsString(notification))
                .id(String.valueOf(System.currentTimeMillis())));
        } catch (IOException e) {
            log.error("Erro ao enviar mensagem de boas-vindas: {}", e.getMessage());
            emitters.remove(emitter);
        }

        return emitter;
    }

    /**
     * Envia uma notificação para todas as conexões SSE ativas.
     *
     * @param eventName Nome do evento
     * @param message Mensagem de notificação
     */
    public void sendNotificationToAll(String eventName, NotificationMessage message) {
        if (emitters.isEmpty()) {
            log.debug("Nenhuma conexão SSE disponível para enviar notificação");
            return;
        }

        log.info("Enviando notificação para {} conexões: {}", emitters.size(), message.getType());

        emitters.removeIf(emitter -> {
            try {
                String jsonData = objectMapper.writeValueAsString(message);
                emitter.send(SseEmitter.event()
                    .name(eventName)
                    .data(jsonData)
                    .id(String.valueOf(System.currentTimeMillis())));
                return false; // Manter emitter
            } catch (IOException e) {
                log.warn("Falha ao enviar notificação para cliente: {}", e.getMessage());
                return true; // Remover emitter
            }
        });

        log.info("Notificação enviada. Conexões ativas: {}", emitters.size());
    }

    /**
     * Envia uma notificação de atualização de dados.
     *
     * @param message Mensagem da notificação
     * @param count Quantidade de registros afetados
     */
    public void sendDataUpdateNotification(String message, int count) {
        NotificationMessage notification = new NotificationMessage(
            "DATA_UPDATE",
            message,
            Map.of(
                "count", count,
                "timestamp", LocalDateTime.now()
            )
        );
        sendNotificationToAll("dataUpdate", notification);
    }

    /**
     * Envia uma notificação de erro.
     *
     * @param message Mensagem de erro
     * @param error Detalhes do erro
     */
    public void sendErrorNotification(String message, String error) {
        NotificationMessage notification = new NotificationMessage(
            "ERROR",
            message,
            Map.of(
                "error", error,
                "timestamp", LocalDateTime.now()
            )
        );
        sendNotificationToAll("error", notification);
    }

    /**
     * Envia uma notificação informativa.
     *
     * @param message Mensagem informativa
     */
    public void sendInfoNotification(String message) {
        NotificationMessage notification = new NotificationMessage(
            "INFO",
            message
        );
        sendNotificationToAll("info", notification);
    }

    /**
     * Obtém o número de conexões SSE ativas.
     *
     * @return Número de conexões ativas
     */
    public int getActiveConnectionsCount() {
        return emitters.size();
    }
}