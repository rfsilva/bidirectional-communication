package com.example.ssedemo.controller;

import com.example.ssedemo.dto.PasswordChangeRequest;
import com.example.ssedemo.model.User;
import com.example.ssedemo.service.MessageService;
import com.example.ssedemo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Controller para gerenciamento de usuários.
 * Acesso restrito por roles.
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "Gerenciamento de usuários (apenas ADMIN)")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;
    private final MessageService messageService;
    private final PasswordEncoder passwordEncoder;

    @Operation(
        summary = "Listar todos os usuários", 
        description = "Retorna lista de todos os usuários do sistema (apenas ADMIN)"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de usuários retornada com sucesso",
                content = @Content(mediaType = "application/json", 
                    schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "403", description = "Acesso negado - apenas ADMIN")
    })
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        log.info("Listando todos os usuários");
        List<User> users = userService.findAll();
        return ResponseEntity.ok(users);
    }

    @Operation(
        summary = "Buscar usuário por ID", 
        description = "Retorna um usuário específico pelo ID (apenas ADMIN)"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Usuário encontrado",
                content = @Content(mediaType = "application/json", 
                    schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "Usuário não encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado - apenas ADMIN")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserById(
            @Parameter(description = "ID do usuário", required = true)
            @PathVariable Long id) {
        
        log.info("Buscando usuário por ID: {}", id);
        
        Optional<User> user = userService.findById(id);
        if (user.isPresent()) {
            return ResponseEntity.ok(user.get());
        } else {
            String message = messageService.getErrorMessage("user.not.found.id", id);
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(
        summary = "Criar novo usuário", 
        description = "Cria um novo usuário no sistema (apenas ADMIN)"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Usuário criado com sucesso",
                content = @Content(mediaType = "application/json", 
                    schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "400", description = "Dados inválidos ou usuário já existe"),
        @ApiResponse(responseCode = "403", description = "Acesso negado - apenas ADMIN")
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody User user) {
        try {
            log.info("Criando novo usuário: {}", user.getUsername());
            
            User createdUser = userService.createUser(user);
            
            String successMessage = messageService.getSuccessMessage("user.created", createdUser.getUsername());
            log.info(successMessage);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
            
        } catch (IllegalArgumentException e) {
            log.warn("Erro ao criar usuário: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Bad Request",
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Erro interno ao criar usuário: {}", e.getMessage(), e);
            String errorMessage = messageService.getErrorMessage("user.create.failed");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Internal Server Error",
                "message", errorMessage
            ));
        }
    }

    @Operation(
        summary = "Atualizar usuário", 
        description = "Atualiza dados de um usuário existente (apenas ADMIN)"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Usuário atualizado com sucesso",
                content = @Content(mediaType = "application/json", 
                    schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "Usuário não encontrado"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "403", description = "Acesso negado - apenas ADMIN")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(
            @Parameter(description = "ID do usuário", required = true)
            @PathVariable Long id,
            @Valid @RequestBody User user) {
        
        try {
            log.info("Atualizando usuário ID: {}", id);
            
            User updatedUser = userService.updateUser(id, user);
            
            String successMessage = messageService.getSuccessMessage("user.updated", updatedUser.getUsername());
            log.info(successMessage);
            
            return ResponseEntity.ok(updatedUser);
            
        } catch (IllegalArgumentException e) {
            log.warn("Erro ao atualizar usuário: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Bad Request",
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Erro interno ao atualizar usuário: {}", e.getMessage(), e);
            String errorMessage = messageService.getErrorMessage("user.update.failed");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Internal Server Error",
                "message", errorMessage
            ));
        }
    }

    @Operation(
        summary = "Desativar usuário", 
        description = "Desativa um usuário (soft delete) - apenas ADMIN"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Usuário desativado com sucesso"),
        @ApiResponse(responseCode = "404", description = "Usuário não encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado - apenas ADMIN")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deactivateUser(
            @Parameter(description = "ID do usuário", required = true)
            @PathVariable Long id) {
        
        try {
            log.info("Desativando usuário ID: {}", id);
            
            userService.deactivateUser(id);
            
            String successMessage = messageService.getSuccessMessage("user.deactivated", id);
            
            return ResponseEntity.ok(Map.of(
                "message", successMessage
            ));
            
        } catch (IllegalArgumentException e) {
            log.warn("Erro ao desativar usuário: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Erro interno ao desativar usuário: {}", e.getMessage(), e);
            String errorMessage = messageService.getErrorMessage("user.deactivate.failed");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Internal Server Error",
                "message", errorMessage
            ));
        }
    }

    @Operation(
        summary = "Ativar usuário", 
        description = "Ativa um usuário desativado - apenas ADMIN"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Usuário ativado com sucesso"),
        @ApiResponse(responseCode = "404", description = "Usuário não encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado - apenas ADMIN")
    })
    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> activateUser(
            @Parameter(description = "ID do usuário", required = true)
            @PathVariable Long id) {
        
        try {
            log.info("Ativando usuário ID: {}", id);
            
            userService.activateUser(id);
            
            String successMessage = messageService.getSuccessMessage("user.activated", id);
            
            return ResponseEntity.ok(Map.of(
                "message", successMessage
            ));
            
        } catch (IllegalArgumentException e) {
            log.warn("Erro ao ativar usuário: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Erro interno ao ativar usuário: {}", e.getMessage(), e);
            String errorMessage = messageService.getErrorMessage("user.activate.failed");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Internal Server Error",
                "message", errorMessage
            ));
        }
    }

    @Operation(
        summary = "Estatísticas de usuários", 
        description = "Retorna estatísticas dos usuários por role - apenas ADMIN"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Estatísticas retornadas com sucesso",
                content = @Content(mediaType = "application/json",
                    examples = @ExampleObject(value = """
                        {
                            "totalUsers": 5,
                            "adminCount": 1,
                            "editorCount": 1,
                            "viewerCount": 3,
                            "activeUsers": 5,
                            "recentlyActive": 2
                        }
                        """))),
        @ApiResponse(responseCode = "403", description = "Acesso negado - apenas ADMIN")
    })
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getUserStats() {
        log.info("Obtendo estatísticas de usuários");
        
        long totalUsers = userService.findAll().size();
        long adminCount = userService.countByRole(User.Role.ADMIN);
        long editorCount = userService.countByRole(User.Role.EDITOR);
        long viewerCount = userService.countByRole(User.Role.VIEWER);
        long activeUsers = userService.findActiveUsers().size();
        
        // Usuários ativos nas últimas 24 horas
        LocalDateTime yesterday = LocalDateTime.now().minusDays(1);
        long recentlyActive = userService.findRecentlyActive(yesterday).size();
        
        Map<String, Object> stats = Map.of(
            "totalUsers", totalUsers,
            "adminCount", adminCount,
            "editorCount", editorCount,
            "viewerCount", viewerCount,
            "activeUsers", activeUsers,
            "recentlyActive", recentlyActive
        );
        
        return ResponseEntity.ok(stats);
    }
}