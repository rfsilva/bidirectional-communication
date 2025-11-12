package com.example.ssedemo.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "Health Check", description = "Endpoints para verificação de saúde da aplicação")
public class HealthController {

    @Operation(
        summary = "Verificar saúde da aplicação", 
        description = "Retorna o status de saúde da aplicação e informações básicas do serviço"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Aplicação está funcionando corretamente",
                content = @Content(mediaType = "application/json",
                    examples = @ExampleObject(value = """
                        {
                            "status": "UP",
                            "timestamp": "2024-01-15T10:30:00",
                            "service": "SSE Demo Backend",
                            "version": "1.0.0"
                        }
                        """)))
    })
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "timestamp", LocalDateTime.now(),
            "service", "SSE Demo Backend",
            "version", "1.0.0"
        ));
    }
}