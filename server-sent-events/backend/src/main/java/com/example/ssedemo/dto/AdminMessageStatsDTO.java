package com.example.ssedemo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para estatísticas administrativas de mensagens.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Estatísticas administrativas de mensagens")
public class AdminMessageStatsDTO {

    @Schema(description = "Total de mensagens no sistema", example = "150")
    private Long totalMessages;

    @Schema(description = "Total de mensagens não lidas", example = "25")
    private Long unreadMessages;

    @Schema(description = "Total de mensagens externas", example = "80")
    private Long externalMessages;

    @Schema(description = "Total de usuários com mensagens", example = "10")
    private Long totalUsers;

    @Schema(description = "Data da última mensagem criada")
    private LocalDateTime lastMessageAt;
}