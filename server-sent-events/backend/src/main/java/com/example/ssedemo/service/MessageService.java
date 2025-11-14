package com.example.ssedemo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

import java.util.Locale;

/**
 * Serviço para gerenciamento de mensagens de internacionalização (i18n).
 * Fornece métodos convenientes para obter mensagens traduzidas.
 */
@Service("messageService")
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageSource messageSource;

    /**
     * Obtém o locale atual do contexto.
     */
    public Locale getCurrentLocale() {
        return LocaleContextHolder.getLocale();
    }

    /**
     * Obtém uma mensagem simples sem argumentos.
     */
    public String getMessage(String key) {
        return getMessage(key, getCurrentLocale());
    }

    /**
     * Obtém uma mensagem com um argumento.
     */
    public String getMessage(String key, Object arg) {
        return getMessage(key, getCurrentLocale(), arg);
    }

    /**
     * Obtém uma mensagem com dois argumentos.
     */
    public String getMessage(String key, Object arg1, Object arg2) {
        return getMessage(key, getCurrentLocale(), arg1, arg2);
    }

    /**
     * Obtém uma mensagem com três argumentos.
     */
    public String getMessage(String key, Object arg1, Object arg2, Object arg3) {
        return getMessage(key, getCurrentLocale(), arg1, arg2, arg3);
    }

    /**
     * Obtém uma mensagem com múltiplos argumentos.
     */
    public String getMessage(String key, Object... args) {
        return getMessage(key, getCurrentLocale(), args);
    }

    /**
     * Obtém uma mensagem com locale específico e argumentos.
     */
    public String getMessage(String key, Locale locale, Object... args) {
        try {
            return messageSource.getMessage(key, args, locale);
        } catch (Exception e) {
            log.warn("Mensagem não encontrada para chave '{}' no locale '{}': {}", key, locale, e.getMessage());
            return key; // Retorna a chave se não encontrar a mensagem
        }
    }

    /**
     * Obtém mensagem de sucesso com argumentos.
     */
    public String getSuccessMessage(String operation, Object... args) {
        String key = "success." + operation;
        return getMessage(key, args);
    }

    /**
     * Obtém mensagem de erro com argumentos.
     */
    public String getErrorMessage(String errorType, Object... args) {
        String key = "error." + errorType;
        return getMessage(key, args);
    }

    /**
     * Obtém mensagem informativa com argumentos.
     */
    public String getInfoMessage(String infoType, Object... args) {
        String key = "info." + infoType;
        return getMessage(key, args);
    }

    /**
     * Obtém mensagem de validação com argumentos.
     */
    public String getValidationMessage(String field, String validationType, Object... args) {
        String key = "validation." + field + "." + validationType;
        return getMessage(key, args);
    }

    /**
     * Obtém mensagem para SSE com argumentos.
     */
    public String getSSEMessage(String sseType, Object... args) {
        String key = "sse." + sseType;
        return getMessage(key, args);
    }
}