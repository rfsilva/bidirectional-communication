package com.example.ssedemo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

import java.util.Locale;

/**
 * Serviço para gerenciar mensagens internacionalizadas.
 * Facilita o acesso às mensagens traduzidas em diferentes idiomas.
 */
@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageSource messageSource;

    /**
     * Obtém uma mensagem traduzida usando o locale atual.
     *
     * @param key Chave da mensagem
     * @return Mensagem traduzida
     */
    public String getMessage(String key) {
        return getMessage(key, null);
    }

    /**
     * Obtém uma mensagem traduzida com parâmetros usando o locale atual.
     *
     * @param key Chave da mensagem
     * @param args Argumentos para substituição na mensagem
     * @return Mensagem traduzida com parâmetros substituídos
     */
    public String getMessage(String key, Object... args) {
        return getMessage(key, LocaleContextHolder.getLocale(), args);
    }

    /**
     * Obtém uma mensagem traduzida para um locale específico.
     *
     * @param key Chave da mensagem
     * @param locale Locale desejado
     * @param args Argumentos para substituição na mensagem
     * @return Mensagem traduzida
     */
    public String getMessage(String key, Locale locale, Object... args) {
        try {
            return messageSource.getMessage(key, args, locale);
        } catch (Exception e) {
            // Fallback para a chave se a mensagem não for encontrada
            return key;
        }
    }

    /**
     * Obtém uma mensagem de validação.
     *
     * @param field Campo que falhou na validação
     * @param validationType Tipo de validação (required, size, etc.)
     * @param args Argumentos adicionais
     * @return Mensagem de validação traduzida
     */
    public String getValidationMessage(String field, String validationType, Object... args) {
        String key = String.format("validation.%s.%s", field, validationType);
        return getMessage(key, args);
    }

    /**
     * Obtém uma mensagem de sucesso.
     *
     * @param operation Operação realizada (created, updated, deleted)
     * @param args Argumentos adicionais
     * @return Mensagem de sucesso traduzida
     */
    public String getSuccessMessage(String operation, Object... args) {
        String key = String.format("data.%s.success", operation);
        return getMessage(key, args);
    }

    /**
     * Obtém uma mensagem de erro.
     *
     * @param errorType Tipo do erro
     * @param args Argumentos adicionais
     * @return Mensagem de erro traduzida
     */
    public String getErrorMessage(String errorType, Object... args) {
        String key = String.format("error.%s", errorType);
        return getMessage(key, args);
    }

    /**
     * Obtém uma mensagem informativa.
     *
     * @param infoType Tipo da informação
     * @param args Argumentos adicionais
     * @return Mensagem informativa traduzida
     */
    public String getInfoMessage(String infoType, Object... args) {
        String key = String.format("info.%s", infoType);
        return getMessage(key, args);
    }

    /**
     * Obtém uma mensagem SSE.
     *
     * @param sseType Tipo da mensagem SSE
     * @param args Argumentos adicionais
     * @return Mensagem SSE traduzida
     */
    public String getSSEMessage(String sseType, Object... args) {
        String key = String.format("sse.%s", sseType);
        return getMessage(key, args);
    }

    /**
     * Obtém o locale atual.
     *
     * @return Locale atual
     */
    public Locale getCurrentLocale() {
        return LocaleContextHolder.getLocale();
    }
}