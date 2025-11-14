package com.example.ssedemo.dto;

import com.example.ssedemo.model.UserMessage;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para requisição de criação de mensagem.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Dados para criação de uma nova mensagem")
public class CreateUserMessageRequest {

    @NotNull(message = "ID do usuário é obrigatório")
    @Schema(description = "ID do usuário destinatário", example = "1", required = true)
    private Long userId;

    @NotBlank(message = "Título é obrigatório")
    @Size(max = 200, message = "Título deve ter no máximo 200 caracteres")
    @Schema(description = "Título da mensagem", example = "Relatório Pronto", required = true)
    private String title;

    @NotBlank(message = "Conteúdo é obrigatório")
    @Size(max = 1000, message = "Conteúdo deve ter no máximo 1000 caracteres")
    @Schema(description = "Conteúdo da mensagem", example = "Seu relatório mensal foi gerado com sucesso", required = true)
    private String content;

    @Schema(description = "Tipo da mensagem", example = "INFO", defaultValue = "INFO")
    private UserMessage.MessageType type;

    @Schema(description = "Prioridade da mensagem", example = "NORMAL", defaultValue = "NORMAL")
    private UserMessage.Priority priority;
}