package com.example.ssedemo.controller;

import com.example.ssedemo.model.DataEntity;
import com.example.ssedemo.service.DataService;
import com.example.ssedemo.service.SSENotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/data")
@Tag(name = "Data Management", description = "Operações CRUD para gerenciamento de dados")
public class DataController {

    private static final Logger logger = LoggerFactory.getLogger(DataController.class);

    @Autowired
    private DataService dataService;

    @Autowired
    private SSENotificationService notificationService;

    @Operation(summary = "Listar todos os dados", description = "Retorna uma lista com todos os registros de dados")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de dados retornada com sucesso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = DataEntity.class)))
    })
    @GetMapping
    public ResponseEntity<List<DataEntity>> getAllData() {
        logger.info("Buscando todos os dados");
        List<DataEntity> data = dataService.findAll();
        return ResponseEntity.ok(data);
    }

    @Operation(summary = "Buscar dados por ID", description = "Retorna um registro específico pelo seu ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Dados encontrados",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = DataEntity.class))),
        @ApiResponse(responseCode = "404", description = "Dados não encontrados")
    })
    @GetMapping("/{id}")
    public ResponseEntity<DataEntity> getDataById(
            @Parameter(description = "ID do registro a ser buscado", required = true)
            @PathVariable Long id) {
        logger.info("Buscando dados por ID: {}", id);
        Optional<DataEntity> data = dataService.findById(id);
        
        if (data.isPresent()) {
            return ResponseEntity.ok(data.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Criar novo registro", description = "Cria um novo registro de dados e envia notificação SSE")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Registro criado com sucesso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = DataEntity.class))),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @PostMapping
    public ResponseEntity<DataEntity> createData(
            @Parameter(description = "Dados do registro a ser criado", required = true)
            @Valid @RequestBody DataEntity dataEntity) {
        logger.info("Criando novo registro: {}", dataEntity.getName());
        
        try {
            DataEntity savedEntity = dataService.save(dataEntity);
            
            // Notificar via SSE sobre novo registro criado
            notificationService.sendDataUpdateNotification(
                "Novo registro criado: " + savedEntity.getName(),
                1
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedEntity);
            
        } catch (Exception e) {
            logger.error("Erro ao criar registro: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Atualizar registro", description = "Atualiza um registro existente e envia notificação SSE")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Registro atualizado com sucesso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = DataEntity.class))),
        @ApiResponse(responseCode = "404", description = "Registro não encontrado"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @PutMapping("/{id}")
    public ResponseEntity<DataEntity> updateData(
            @Parameter(description = "ID do registro a ser atualizado", required = true)
            @PathVariable Long id,
            @Parameter(description = "Novos dados do registro", required = true)
            @Valid @RequestBody DataEntity dataEntity) {
        logger.info("Atualizando registro ID: {}", id);
        
        if (!dataService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        try {
            dataEntity.setId(id);
            dataEntity.setUpdatedAt(LocalDateTime.now());
            DataEntity updatedEntity = dataService.save(dataEntity);
            
            // Notificar via SSE sobre atualização
            notificationService.sendInfoNotification(
                "Registro atualizado: " + updatedEntity.getName()
            );
            
            return ResponseEntity.ok(updatedEntity);
            
        } catch (Exception e) {
            logger.error("Erro ao atualizar registro: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Excluir registro", description = "Remove um registro pelo ID e envia notificação SSE")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Registro excluído com sucesso"),
        @ApiResponse(responseCode = "404", description = "Registro não encontrado"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteData(
            @Parameter(description = "ID do registro a ser excluído", required = true)
            @PathVariable Long id) {
        logger.info("Deletando registro ID: {}", id);
        
        if (!dataService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        try {
            dataService.deleteById(id);
            
            // Notificar via SSE sobre exclusão
            notificationService.sendInfoNotification(
                "Registro excluído (ID: " + id + ")"
            );
            
            return ResponseEntity.noContent().build();
            
        } catch (Exception e) {
            logger.error("Erro ao deletar registro: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Listar dados externos", description = "Retorna apenas os registros marcados como externos")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de dados externos",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = DataEntity.class)))
    })
    @GetMapping("/external")
    public ResponseEntity<List<DataEntity>> getExternalData() {
        logger.info("Buscando dados externos");
        List<DataEntity> externalData = dataService.findExternalData();
        return ResponseEntity.ok(externalData);
    }

    @Operation(summary = "Listar dados internos", description = "Retorna apenas os registros marcados como internos")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de dados internos",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = DataEntity.class)))
    })
    @GetMapping("/internal")
    public ResponseEntity<List<DataEntity>> getInternalData() {
        logger.info("Buscando dados internos");
        List<DataEntity> internalData = dataService.findInternalData();
        return ResponseEntity.ok(internalData);
    }

    @Operation(summary = "Obter estatísticas", description = "Retorna estatísticas gerais dos dados e conexões SSE")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Estatísticas retornadas com sucesso",
                content = @Content(mediaType = "application/json"))
    })
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        logger.info("Buscando estatísticas");
        
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