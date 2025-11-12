package com.example.ssedemo.controller;

import com.example.ssedemo.model.DataEntity;
import com.example.ssedemo.service.DataService;
import com.example.ssedemo.service.SSENotificationService;
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
public class DataController {

    private static final Logger logger = LoggerFactory.getLogger(DataController.class);

    @Autowired
    private DataService dataService;

    @Autowired
    private SSENotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<DataEntity>> getAllData() {
        logger.info("Buscando todos os dados");
        List<DataEntity> data = dataService.findAll();
        return ResponseEntity.ok(data);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DataEntity> getDataById(@PathVariable Long id) {
        logger.info("Buscando dados por ID: {}", id);
        Optional<DataEntity> data = dataService.findById(id);
        
        if (data.isPresent()) {
            return ResponseEntity.ok(data.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<DataEntity> createData(@Valid @RequestBody DataEntity dataEntity) {
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

    @PutMapping("/{id}")
    public ResponseEntity<DataEntity> updateData(@PathVariable Long id, @Valid @RequestBody DataEntity dataEntity) {
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteData(@PathVariable Long id) {
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

    @GetMapping("/external")
    public ResponseEntity<List<DataEntity>> getExternalData() {
        logger.info("Buscando dados externos");
        List<DataEntity> externalData = dataService.findExternalData();
        return ResponseEntity.ok(externalData);
    }

    @GetMapping("/internal")
    public ResponseEntity<List<DataEntity>> getInternalData() {
        logger.info("Buscando dados internos");
        List<DataEntity> internalData = dataService.findInternalData();
        return ResponseEntity.ok(internalData);
    }

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