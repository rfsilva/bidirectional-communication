package com.example.ssedemo.dto;

import com.example.ssedemo.model.UserMessage;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para representar uma mensagem de usuário nas respostas da API.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Dados de uma mensagem de usuário")
public class UserMessageDTO {

    @Schema(description = "ID único da mensagem", example = "1")
    private Long id;

    @Schema(description = "Título da mensagem", example = "Relatório Pronto")
    private String title;

    @Schema(description = "Conteúdo da mensagem", example = "Seu relatório mensal foi gerado com sucesso")
    private String content;

    @Schema(description = "Tipo da mensagem", example = "INFO")
    private UserMessage.MessageType type;

    @Schema(description = "Prioridade da mensagem", example = "NORMAL")
    private UserMessage.Priority priority;

    @Schema(description = "Indica se a mensagem foi lida", example = "false")
    private Boolean isRead;

    @Schema(description = "Indica se a mensagem veio de sistema externo", example = "true")
    private Boolean isExternal;

    @Schema(description = "Fonte externa da mensagem", example = "REPORT_SYSTEM")
    private String externalSource;

    @Schema(description = "ID do usuário destinatário", example = "1")
    private Long userId;

    @Schema(description = "Nome do usuário destinatário", example = "admin")
    private String username;

    @Schema(description = "Nome completo do usuário destinatário", example = "Administrador Sistema")
    private String userFullName;

    @Schema(description = "Data e hora de criação")
    private LocalDateTime createdAt;

    @Schema(description = "Data e hora da última atualização")
    private LocalDateTime updatedAt;

    @Schema(description = "Data e hora em que foi lida")
    private LocalDateTime readAt;
}