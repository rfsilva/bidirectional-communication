package com.example.websocketdemo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para alteração de senha.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Dados para alteração de senha")
public class PasswordChangeRequest {

    @NotBlank(message = "{validation.currentPassword.required}")
    @Schema(description = "Senha atual do usuário", required = true)
    private String currentPassword;

    @NotBlank(message = "{validation.newPassword.required}")
    @Size(min = 6, message = "{validation.password.size}")
    @Schema(description = "Nova senha do usuário", required = true, minLength = 6)
    private String newPassword;

    @NotBlank(message = "{validation.confirmPassword.required}")
    @Schema(description = "Confirmação da nova senha", required = true)
    private String confirmPassword;
}
