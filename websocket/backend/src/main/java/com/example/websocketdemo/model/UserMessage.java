package com.example.websocketdemo.model;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entidade de mensagem para usuários.
 * Representa mensagens que podem ser enviadas para usuários específicos.
 */
@Entity
@Table(name = "user_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Mensagem para usuário específico")
public class UserMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "ID único da mensagem", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    @NotBlank(message = "{validation.message.title.required}")
    @Size(max = 200, message = "{validation.message.title.size}")
    @Column(nullable = false, length = 200)
    @Schema(description = "Título da mensagem", example = "Relatório Pronto", required = true, maxLength = 200)
    private String title;

    @NotBlank(message = "{validation.message.content.required}")
    @Size(max = 1000, message = "{validation.message.content.size}")
    @Column(nullable = false, length = 1000)
    @Schema(description = "Conteúdo da mensagem", example = "Seu relatório mensal foi gerado com sucesso", required = true, maxLength = 1000)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Schema(description = "Tipo da mensagem", example = "INFO", 
            allowableValues = {"INFO", "SUCCESS", "WARNING", "ERROR"})
    private MessageType type = MessageType.INFO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Schema(description = "Prioridade da mensagem", example = "NORMAL", 
            allowableValues = {"LOW", "NORMAL", "HIGH", "URGENT"})
    private Priority priority = Priority.NORMAL;

    @Column(name = "is_read", nullable = false)
    @Schema(description = "Indica se a mensagem foi lida", example = "false", defaultValue = "false")
    private Boolean isRead = false;

    @Column(name = "is_external", nullable = false)
    @Schema(description = "Indica se a mensagem veio de sistema externo", example = "true", defaultValue = "false")
    private Boolean isExternal = false;

    @Column(name = "external_source")
    @Schema(description = "Fonte externa da mensagem", example = "REPORT_SYSTEM")
    private String externalSource;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @Schema(description = "Usuário destinatário da mensagem")
    private User user;

    @Column(name = "created_at", nullable = false)
    @Schema(description = "Data e hora de criação", accessMode = Schema.AccessMode.READ_ONLY)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @Schema(description = "Data e hora da última atualização", accessMode = Schema.AccessMode.READ_ONLY)
    private LocalDateTime updatedAt;

    @Column(name = "read_at")
    @Schema(description = "Data e hora em que foi lida", accessMode = Schema.AccessMode.READ_ONLY)
    private LocalDateTime readAt;

    /**
     * Enum para tipos de mensagem
     */
    public enum MessageType {
        INFO("Informação", "Mensagem informativa"),
        SUCCESS("Sucesso", "Operação realizada com sucesso"),
        WARNING("Aviso", "Mensagem de alerta"),
        ERROR("Erro", "Mensagem de erro");

        private final String displayName;
        private final String description;

        MessageType(String displayName, String description) {
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

    /**
     * Enum para prioridades de mensagem
     */
    public enum Priority {
        LOW("Baixa", 1),
        NORMAL("Normal", 2),
        HIGH("Alta", 3),
        URGENT("Urgente", 4);

        private final String displayName;
        private final int level;

        Priority(String displayName, int level) {
            this.displayName = displayName;
            this.level = level;
        }

        public String getDisplayName() {
            return displayName;
        }

        public int getLevel() {
            return level;
        }
    }

    // Construtores auxiliares
    public UserMessage(String title, String content, MessageType type, User user) {
        this.title = title;
        this.content = content;
        this.type = type;
        this.user = user;
        this.isRead = false;
        this.isExternal = false;
        this.priority = Priority.NORMAL;
        this.createdAt = LocalDateTime.now();
    }

    public UserMessage(String title, String content, MessageType type, Priority priority, User user, String externalSource) {
        this.title = title;
        this.content = content;
        this.type = type;
        this.priority = priority;
        this.user = user;
        this.externalSource = externalSource;
        this.isRead = false;
        this.isExternal = externalSource != null;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.isRead == null) {
            this.isRead = false;
        }
        if (this.isExternal == null) {
            this.isExternal = false;
        }
        if (this.priority == null) {
            this.priority = Priority.NORMAL;
        }
        if (this.type == null) {
            this.type = MessageType.INFO;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Marca a mensagem como lida
     */
    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Marca a mensagem como não lida
     */
    public void markAsUnread() {
        this.isRead = false;
        this.readAt = null;
        this.updatedAt = LocalDateTime.now();
    }
}