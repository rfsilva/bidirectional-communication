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
 * Entidade de dados que pode ser interna ou externa.
 * Utiliza Lombok para reduzir boilerplate code.
 */
@Entity
@Table(name = "data_entities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Entidade de dados que pode ser interna ou externa")
public class DataEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "ID único do registro", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    @NotBlank(message = "{validation.name.required}")
    @Size(max = 100, message = "{validation.name.size}")
    @Column(nullable = false, length = 100)
    @Schema(description = "Nome do item de dados", example = "Produto A - 14:30:15", required = true, maxLength = 100)
    private String name;

    @NotBlank(message = "{validation.value.required}")
    @Size(max = 255, message = "{validation.value.size}")
    @Column(name = "data_value", nullable = false)
    @Schema(description = "Valor ou descrição do item", example = "Disponível (Externo)", required = true, maxLength = 255)
    private String value;

    @Column(name = "created_at", nullable = false)
    @Schema(description = "Data e hora de criação do registro", example = "2024-01-15T10:30:00", accessMode = Schema.AccessMode.READ_ONLY)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @Schema(description = "Data e hora da última atualização", example = "2024-01-15T11:45:30", accessMode = Schema.AccessMode.READ_ONLY)
    private LocalDateTime updatedAt;

    @Column(name = "is_external", nullable = false)
    @Schema(description = "Indica se o dado é de origem externa (true) ou interna (false)", example = "true", defaultValue = "false")
    private Boolean isExternal = false;

    /**
     * Construtor para criar uma entidade com nome e valor.
     *
     * @param name Nome do item
     * @param value Valor do item
     */
    public DataEntity(String name, String value) {
        this.name = name;
        this.value = value;
        this.createdAt = LocalDateTime.now();
        this.isExternal = false;
    }

    /**
     * Construtor para criar uma entidade com nome, valor e flag externa.
     *
     * @param name Nome do item
     * @param value Valor do item
     * @param isExternal Flag indicando se é externo
     */
    public DataEntity(String name, String value, Boolean isExternal) {
        this.name = name;
        this.value = value;
        this.createdAt = LocalDateTime.now();
        this.isExternal = isExternal;
    }

    /**
     * Método executado antes de persistir a entidade.
     * Define a data de criação se não estiver definida.
     */
    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.isExternal == null) {
            this.isExternal = false;
        }
    }

    /**
     * Método executado antes de atualizar a entidade.
     * Atualiza a data de modificação.
     */
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}