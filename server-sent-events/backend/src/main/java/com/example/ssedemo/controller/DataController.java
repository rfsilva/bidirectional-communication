package com.example.ssedemo.controller;

import com.example.ssedemo.model.DataEntity;
import com.example.ssedemo.service.DataService;
import com.example.ssedemo.service.MessageService;
import com.example.ssedemo.service.SSENotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Controller para gerenciamento de dados com controle de acesso baseado em roles.
 * 
 * Permissões:
 * - ADMIN: Acesso total (CRUD)
 * - EDITOR: Acesso total (CRUD) 
 * - VIEWER: Apenas leitura (GET)
 */
@RestController
@RequestMapping("/api/data")
@Tag(name = "Data Management", description = "Operações CRUD para gerenciamento de dados")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
@Slf4j
public class DataController {

    private final DataService dataService;
    private final SSENotificationService notificationService;
    private final MessageService messageService;

    @Operation(summary = "Listar todos os dados", description = "Retorna uma lista com todos os registros de dados")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de dados retornada com sucesso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = DataEntity.class))),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'VIEWER')")
    public ResponseEntity<List<DataEntity>> getAllData() {
        log.info(messageService.getInfoMessage("fetching.all.data"));
        List<DataEntity> data = dataService.findAll();
        return ResponseEntity.ok(data);
    }

    @Operation(summary = "Buscar dados por ID", description = "Retorna um registro específico pelo seu ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Dados encontrados",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = DataEntity.class))),
        @ApiResponse(responseCode = "404", description = "Dados não encontrados"),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'VIEWER')")
    public ResponseEntity<DataEntity> getDataById(
            @Parameter(description = "ID do registro a ser buscado", required = true)
            @PathVariable Long id) {
        log.info(messageService.getInfoMessage("fetching.data.by.id", id));
        Optional<DataEntity> data = dataService.findById(id);
        
        return data.map(ResponseEntity::ok)
                  .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Criar novo registro", description = "Cria um novo registro de dados e envia notificação SSE (ADMIN/EDITOR)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Registro criado com sucesso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = DataEntity.class))),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado - apenas ADMIN/EDITOR"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<DataEntity> createData(
            @Parameter(description = "Dados do registro a ser criado", required = true)
            @Valid @RequestBody DataEntity dataEntity) {
        log.info(messageService.getInfoMessage("creating.record", dataEntity.getName()));
        
        try {
            DataEntity savedEntity = dataService.save(dataEntity);
            
            // Notificar via SSE sobre novo registro criado
            String successMessage = messageService.getSuccessMessage("created", savedEntity.getName());
            notificationService.sendDataUpdateNotification(successMessage, 1);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedEntity);
            
        } catch (Exception e) {
            String errorMessage = messageService.getErrorMessage("create.failed", e.getMessage());
            log.error(errorMessage, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Atualizar registro", description = "Atualiza um registro existente e envia notificação SSE (ADMIN/EDITOR)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Registro atualizado com sucesso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = DataEntity.class))),
        @ApiResponse(responseCode = "404", description = "Registro não encontrado"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado - apenas ADMIN/EDITOR"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<DataEntity> updateData(
            @Parameter(description = "ID do registro a ser atualizado", required = true)
            @PathVariable Long id,
            @Parameter(description = "Novos dados do registro", required = true)
            @Valid @RequestBody DataEntity dataEntity) {
        log.info(messageService.getInfoMessage("updating.record", id));
        
        if (!dataService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        try {
            dataEntity.setId(id);
            dataEntity.setUpdatedAt(LocalDateTime.now());
            DataEntity updatedEntity = dataService.save(dataEntity);
            
            // Notificar via SSE sobre atualização
            String successMessage = messageService.getSuccessMessage("updated", updatedEntity.getName());
            notificationService.sendInfoNotification(successMessage);
            
            return ResponseEntity.ok(updatedEntity);
            
        } catch (Exception e) {
            String errorMessage = messageService.getErrorMessage("update.failed", e.getMessage());
            log.error(errorMessage, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Excluir registro", description = "Remove um registro pelo ID e envia notificação SSE (ADMIN/EDITOR)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Registro excluído com sucesso"),
        @ApiResponse(responseCode = "404", description = "Registro não encontrado"),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado - apenas ADMIN/EDITOR"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<Void> deleteData(
            @Parameter(description = "ID do registro a ser excluído", required = true)
            @PathVariable Long id) {
        log.info(messageService.getInfoMessage("deleting.record", id));
        
        if (!dataService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        try {
            dataService.deleteById(id);
            
            // Notificar via SSE sobre exclusão
            String successMessage = messageService.getSuccessMessage("deleted", id);
            notificationService.sendInfoNotification(successMessage);
            
            return ResponseEntity.noContent().build();
            
        } catch (Exception e) {
            String errorMessage = messageService.getErrorMessage("delete.failed", e.getMessage());
            log.error(errorMessage, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Listar dados externos", description = "Retorna apenas os registros marcados como externos")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de dados externos",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = DataEntity.class))),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/external")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'VIEWER')")
    public ResponseEntity<List<DataEntity>> getExternalData() {
        log.info(messageService.getInfoMessage("fetching.external.data"));
        List<DataEntity> externalData = dataService.findExternalData();
        return ResponseEntity.ok(externalData);
    }

    @Operation(summary = "Listar dados internos", description = "Retorna apenas os registros marcados como internos")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de dados internos",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = DataEntity.class))),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/internal")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'VIEWER')")
    public ResponseEntity<List<DataEntity>> getInternalData() {
        log.info(messageService.getInfoMessage("fetching.internal.data"));
        List<DataEntity> internalData = dataService.findInternalData();
        return ResponseEntity.ok(internalData);
    }

    @Operation(summary = "Obter estatísticas", description = "Retorna estatísticas gerais dos dados e conexões SSE")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Estatísticas retornadas com sucesso",
                content = @Content(mediaType = "application/json")),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'VIEWER')")
    public ResponseEntity<Map<String, Object>> getStats() {
        log.info(messageService.getInfoMessage("fetching.stats"));
        
        long totalCount = dataService.getTotalCount();
        long externalCount = dataService.findExternalData().size();
        long internalCount = dataService.findInternalData().size();
        LocalDateTime lastCreated = dataService.getLastCreatedAt();
        
        Map<String, Object> stats = Map.of(
            "totalRecords", totalCount,
            "externalRecords", externalCount,
            "internalRecords", internalCount,
            "lastCreatedAt", lastCreated != null ? lastCreated : "N/A",
            "activeSSEConnections", notificationService.getActiveConnectionsCount()
        );
        
        return ResponseEntity.ok(stats);
    }
}