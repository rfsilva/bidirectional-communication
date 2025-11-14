package com.example.ssedemo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para estatísticas de mensagens do usuário.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Estatísticas de mensagens do usuário")
public class UserMessageStatsDTO {

    @Schema(description = "Total de mensagens", example = "25")
    private Long totalMessages;

    @Schema(description = "Mensagens não lidas", example = "5")
    private Long unreadMessages;

    @Schema(description = "Mensagens lidas", example = "20")
    private Long readMessages;

    @Schema(description = "Mensagens informativas", example = "10")
    private Long infoMessages;

    @Schema(description = "Mensagens de sucesso", example = "8")
    private Long successMessages;

    @Schema(description = "Mensagens de aviso", example = "5")
    private Long warningMessages;

    @Schema(description = "Mensagens de erro", example = "2")
    private Long errorMessages;

    @Schema(description = "Mensagens externas", example = "15")
    private Long externalMessages;

    @Schema(description = "Mensagens internas", example = "10")
    private Long internalMessages;
}