package com.example.ssedemo.controller;

import com.example.ssedemo.dto.PasswordChangeRequest;
import com.example.ssedemo.model.User;
import com.example.ssedemo.service.MessageService;
import com.example.ssedemo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller para gerenciamento do perfil do usuário logado.
 * Todos os usuários autenticados podem acessar.
 */
@RestController
@RequestMapping("/api/profile")
@Tag(name = "User Profile", description = "Gerenciamento do perfil do usuário logado")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
@Slf4j
public class ProfileController {

    private final UserService userService;
    private final MessageService messageService;
    private final PasswordEncoder passwordEncoder;

    @Operation(
        summary = "Obter perfil do usuário", 
        description = "Retorna dados do perfil do usuário atualmente logado"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Perfil retornado com sucesso",
                content = @Content(mediaType = "application/json", 
                    schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado")
    })
    @GetMapping
    public ResponseEntity<?> getProfile(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof User user) {
            log.debug("Obtendo perfil do usuário: {}", user.getUsername());
            return ResponseEntity.ok(user);
        }
        
        return ResponseEntity.status(401).body(Map.of(
            "error", "Unauthorized",
            "message", messageService.getErrorMessage("auth.not.authenticated")
        ));
    }

    @Operation(
        summary = "Atualizar perfil do usuário", 
        description = "Atualiza dados do perfil do usuário logado (exceto senha e role)"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Perfil atualizado com sucesso",
                content = @Content(mediaType = "application/json", 
                    schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado")
    })
    @PutMapping
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody User profileUpdate,
            Authentication authentication) {
        
        if (authentication == null || !(authentication.getPrincipal() instanceof User currentUser)) {
            return ResponseEntity.status(401).body(Map.of(
                "error", "Unauthorized",
                "message", messageService.getErrorMessage("auth.not.authenticated")
            ));
        }

        try {
            log.info("Atualizando perfil do usuário: {}", currentUser.getUsername());

            // Preservar dados que o usuário não pode alterar
            profileUpdate.setId(currentUser.getId());
            profileUpdate.setPassword(currentUser.getPassword()); // Manter senha atual
            profileUpdate.setRole(currentUser.getRole()); // Manter role atual
            profileUpdate.setIsActive(currentUser.getIsActive()); // Manter status atual
            profileUpdate.setCreatedAt(currentUser.getCreatedAt());
            profileUpdate.setLastLogin(currentUser.getLastLogin());

            User updatedUser = userService.updateUser(currentUser.getId(), profileUpdate);
            
            String successMessage = messageService.getSuccessMessage("profile.updated", updatedUser.getUsername());
            log.info(successMessage);
            
            return ResponseEntity.ok(updatedUser);
            
        } catch (IllegalArgumentException e) {
            log.warn("Erro ao atualizar perfil: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Bad Request",
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Erro interno ao atualizar perfil: {}", e.getMessage(), e);
            String errorMessage = messageService.getErrorMessage("profile.update.failed");
            return ResponseEntity.status(500).body(Map.of(
                "error", "Internal Server Error",
                "message", errorMessage
            ));
        }
    }

    @Operation(
        summary = "Alterar senha", 
        description = "Permite ao usuário alterar sua própria senha"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Senha alterada com sucesso"),
        @ApiResponse(responseCode = "400", description = "Senha atual incorreta ou dados inválidos"),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado")
    })
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody PasswordChangeRequest passwordRequest,
            Authentication authentication) {
        
        if (authentication == null || !(authentication.getPrincipal() instanceof User currentUser)) {
            return ResponseEntity.status(401).body(Map.of(
                "error", "Unauthorized",
                "message", messageService.getErrorMessage("auth.not.authenticated")
            ));
        }

        try {
            log.info("Alterando senha do usuário: {}", currentUser.getUsername());

            // Validar senha atual
            if (!passwordEncoder.matches(passwordRequest.getCurrentPassword(), currentUser.getPassword())) {
                String errorMessage = messageService.getErrorMessage("password.current.invalid");
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Bad Request",
                    "message", errorMessage
                ));
            }

            // Validar confirmação de senha
            if (!passwordRequest.getNewPassword().equals(passwordRequest.getConfirmPassword())) {
                String errorMessage = messageService.getErrorMessage("password.confirmation.mismatch");
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Bad Request",
                    "message", errorMessage
                ));
            }

            // Atualizar senha
            userService.updatePassword(currentUser.getId(), passwordRequest.getNewPassword());
            
            String successMessage = messageService.getSuccessMessage("password.changed", currentUser.getUsername());
            log.info(successMessage);
            
            return ResponseEntity.ok(Map.of(
                "message", successMessage
            ));
            
        } catch (Exception e) {
            log.error("Erro ao alterar senha: {}", e.getMessage(), e);
            String errorMessage = messageService.getErrorMessage("password.change.failed");
            return ResponseEntity.status(500).body(Map.of(
                "error", "Internal Server Error",
                "message", errorMessage
            ));
        }
    }
}