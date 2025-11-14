package com.example.ssedemo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para requisição de autenticação.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Dados para autenticação do usuário")
public class AuthRequest {

    @NotBlank(message = "{validation.login.required}")
    @Schema(description = "Username ou email do usuário", example = "admin", required = true)
    private String login;

    @NotBlank(message = "{validation.password.required}")
    @Schema(description = "Senha do usuário", example = "admin123", required = true)
    private String password;
}