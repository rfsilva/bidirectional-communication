package com.example.ssedemo.model;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

@Entity
@Table(name = "data_entities")
@Schema(description = "Entidade de dados que pode ser interna ou externa")
public class DataEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "ID único do registro", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
    @Column(nullable = false, length = 100)
    @Schema(description = "Nome do item de dados", example = "Produto A - 14:30:15", required = true, maxLength = 100)
    private String name;

    @NotBlank(message = "Valor é obrigatório")
    @Size(max = 255, message = "Valor deve ter no máximo 255 caracteres")
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

    public DataEntity() {
        this.createdAt = LocalDateTime.now();
    }

    public DataEntity(String name, String value) {
        this();
        this.name = name;
        this.value = value;
    }

    public DataEntity(String name, String value, Boolean isExternal) {
        this(name, value);
        this.isExternal = isExternal;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Boolean getIsExternal() {
        return isExternal;
    }

    public void setIsExternal(Boolean isExternal) {
        this.isExternal = isExternal;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return "DataEntity{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", value='" + value + '\'' +
                ", createdAt=" + createdAt +
                ", isExternal=" + isExternal +
                '}';
    }
}