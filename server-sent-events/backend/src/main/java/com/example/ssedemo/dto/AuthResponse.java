package com.example.ssedemo.dto;

import com.example.ssedemo.model.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para resposta de autenticação.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Resposta da autenticação com token JWT e dados do usuário")
public class AuthResponse {

    @Schema(description = "Token JWT para autenticação", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String token;

    @Schema(description = "Tipo do token", example = "Bearer")
    private String tokenType = "Bearer";

    @Schema(description = "Dados do usuário autenticado")
    private UserInfo user;

    @Schema(description = "Data e hora da autenticação")
    private LocalDateTime authenticatedAt;

    @Schema(description = "Tempo de expiração do token em segundos", example = "86400")
    private Long expiresIn;

    public AuthResponse(String token, User user, Long expiresIn) {
        this.token = token;
        this.user = new UserInfo(user);
        this.authenticatedAt = LocalDateTime.now();
        this.expiresIn = expiresIn;
    }

    /**
     * Informações básicas do usuário para resposta de autenticação.
     */
    @Data
    @NoArgsConstructor
    @Schema(description = "Informações básicas do usuário")
    public static class UserInfo {
        @Schema(description = "ID do usuário", example = "1")
        private Long id;

        @Schema(description = "Nome de usuário", example = "admin")
        private String username;

        @Schema(description = "Email do usuário", example = "admin@ssedemo.com")
        private String email;

        @Schema(description = "Nome completo", example = "Administrador Sistema")
        private String fullName;

        @Schema(description = "Iniciais do nome", example = "AS")
        private String initials;

        @Schema(description = "Perfil de acesso", example = "ADMIN")
        private User.Role role;

        @Schema(description = "Nome do perfil", example = "Administrador")
        private String roleName;

        @Schema(description = "URL do avatar")
        private String avatarUrl;

        @Schema(description = "Indica se o usuário está ativo", example = "true")
        private Boolean isActive;

        @Schema(description = "Data do último login")
        private LocalDateTime lastLogin;

        public UserInfo(User user) {
            this.id = user.getId();
            this.username = user.getUsername();
            this.email = user.getEmail();
            this.fullName = user.getFullName();
            this.initials = user.getInitials();
            this.role = user.getRole();
            this.roleName = user.getRole().getDisplayName();
            this.avatarUrl = user.getAvatarUrl();
            this.isActive = user.getIsActive();
            this.lastLogin = user.getLastLogin();
        }
    }
}