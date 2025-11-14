package com.example.ssedemo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * Entidade de usuário para autenticação e autorização.
 * Implementa UserDetails para integração com Spring Security.
 */
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Usuário do sistema com controle de acesso baseado em roles")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "ID único do usuário", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    @NotBlank(message = "{validation.username.required}")
    @Size(min = 3, max = 50, message = "{validation.username.size}")
    @Column(unique = true, nullable = false, length = 50)
    @Schema(description = "Nome de usuário único", example = "admin", required = true, minLength = 3, maxLength = 50)
    private String username;

    @NotBlank(message = "{validation.email.required}")
    @Email(message = "{validation.email.format}")
    @Column(unique = true, nullable = false)
    @Schema(description = "Email do usuário", example = "admin@ssedemo.com", required = true)
    private String email;

    @NotBlank(message = "{validation.password.required}")
    @Size(min = 6, message = "{validation.password.size}")
    @JsonIgnore // Nunca expor senha no JSON
    @Column(nullable = false)
    @Schema(description = "Senha do usuário (criptografada)", accessMode = Schema.AccessMode.WRITE_ONLY)
    private String password;

    @NotBlank(message = "{validation.firstName.required}")
    @Size(max = 100, message = "{validation.firstName.size}")
    @Column(name = "first_name", nullable = false, length = 100)
    @Schema(description = "Primeiro nome", example = "João", required = true, maxLength = 100)
    private String firstName;

    @NotBlank(message = "{validation.lastName.required}")
    @Size(max = 100, message = "{validation.lastName.size}")
    @Column(name = "last_name", nullable = false, length = 100)
    @Schema(description = "Sobrenome", example = "Silva", required = true, maxLength = 100)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Schema(description = "Perfil de acesso do usuário", example = "ADMIN", 
            allowableValues = {"ADMIN", "EDITOR", "VIEWER"})
    private Role role;

    @Column(name = "avatar_url")
    @Schema(description = "URL do avatar do usuário", example = "https://example.com/avatar.jpg")
    private String avatarUrl;

    @Column(name = "is_active", nullable = false)
    @Schema(description = "Indica se o usuário está ativo", example = "true", defaultValue = "true")
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    @Schema(description = "Data e hora de criação", accessMode = Schema.AccessMode.READ_ONLY)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @Schema(description = "Data e hora da última atualização", accessMode = Schema.AccessMode.READ_ONLY)
    private LocalDateTime updatedAt;

    @Column(name = "last_login")
    @Schema(description = "Data e hora do último login", accessMode = Schema.AccessMode.READ_ONLY)
    private LocalDateTime lastLogin;

    /**
     * Enum para definir os perfis de acesso
     */
    public enum Role {
        ADMIN("Administrador", "Acesso total ao sistema"),
        EDITOR("Editor", "Pode editar dados do sistema"),
        VIEWER("Visualizador", "Apenas visualização");

        private final String displayName;
        private final String description;

        Role(String displayName, String description) {
            this.displayName = displayName;
            this.description = description;
        }

        public String getDisplayName() {
            return displayName;
        }

        public String getDescription() {
            return description;
        }
    }

    // Construtores auxiliares
    public User(String username, String email, String password, String firstName, String lastName, Role role) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.isActive = true;
        this.createdAt = LocalDateTime.now();
    }

    // Métodos auxiliares
    public String getFullName() {
        return firstName + " " + lastName;
    }

    public String getInitials() {
        return (firstName.substring(0, 1) + lastName.substring(0, 1)).toUpperCase();
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.isActive == null) {
            this.isActive = true;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Implementação do UserDetails para Spring Security
    @Override
    @JsonIgnore
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonExpired() {
        return isActive;
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonLocked() {
        return isActive;
    }

    @Override
    @JsonIgnore
    public boolean isCredentialsNonExpired() {
        return isActive;
    }

    @Override
    @JsonIgnore
    public boolean isEnabled() {
        return isActive;
    }

    // Método para atualizar último login
    public void updateLastLogin() {
        this.lastLogin = LocalDateTime.now();
    }
}