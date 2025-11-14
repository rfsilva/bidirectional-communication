package com.example.ssedemo.dto;

import com.example.ssedemo.model.UserMessage;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para requisição de atualização de mensagem.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Dados para atualização de uma mensagem")
public class UpdateUserMessageRequest {

    @Size(max = 200, message = "Título deve ter no máximo 200 caracteres")
    @Schema(description = "Título da mensagem", example = "Relatório Pronto - Atualizado")
    private String title;

    @Size(max = 1000, message = "Conteúdo deve ter no máximo 1000 caracteres")
    @Schema(description = "Conteúdo da mensagem", example = "Seu relatório mensal foi atualizado com sucesso")
    private String content;

    @Schema(description = "Tipo da mensagem", example = "SUCCESS")
    private UserMessage.MessageType type;

    @Schema(description = "Prioridade da mensagem", example = "HIGH")
    private UserMessage.Priority priority;
}