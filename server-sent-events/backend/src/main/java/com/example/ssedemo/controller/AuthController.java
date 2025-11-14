package com.example.ssedemo.controller;

import com.example.ssedemo.dto.AuthRequest;
import com.example.ssedemo.dto.AuthResponse;
import com.example.ssedemo.model.User;
import com.example.ssedemo.security.JwtTokenProvider;
import com.example.ssedemo.service.MessageService;
import com.example.ssedemo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller para autenticação de usuários.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints para autenticação e autorização")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserService userService;
    private final MessageService messageService;

    @Operation(
        summary = "Autenticar usuário", 
        description = "Realiza login do usuário e retorna token JWT para acesso aos endpoints protegidos"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Login realizado com sucesso",
                content = @Content(mediaType = "application/json", 
                    schema = @Schema(implementation = AuthResponse.class),
                    examples = @ExampleObject(value = """
                        {
                            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                            "tokenType": "Bearer",
                            "user": {
                                "id": 1,
                                "username": "admin",
                                "email": "admin@ssedemo.com",
                                "fullName": "Administrador Sistema",
                                "role": "ADMIN",
                                "roleName": "Administrador"
                            },
                            "expiresIn": 86400
                        }
                        """))),
        @ApiResponse(responseCode = "401", description = "Credenciais inválidas",
                content = @Content(mediaType = "application/json",
                    examples = @ExampleObject(value = """
                        {
                            "error": "Unauthorized",
                            "message": "Credenciais inválidas"
                        }
                        """))),
        @ApiResponse(responseCode = "400", description = "Dados de entrada inválidos")
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest authRequest) {
        try {
            log.info("Tentativa de login para: {}", authRequest.getLogin());

            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    authRequest.getLogin(),
                    authRequest.getPassword()
                )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            User user = (User) authentication.getPrincipal();
            String jwt = tokenProvider.generateToken(authentication);
            
            // Atualizar último login
            userService.updateLastLogin(user.getUsername());
            
            // Calcular tempo de expiração
            long expiresIn = tokenProvider.getTokenRemainingTime(jwt);
            
            AuthResponse response = new AuthResponse(jwt, user, expiresIn);
            
            log.info("Login realizado com sucesso para: {} ({})", user.getUsername(), user.getRole());
            
            return ResponseEntity.ok(response);

        } catch (BadCredentialsException e) {
            log.warn("Tentativa de login com credenciais inválidas: {}", authRequest.getLogin());
            
            String errorMessage = messageService.getErrorMessage("auth.invalid.credentials");
            return ResponseEntity.status(401).body(Map.of(
                "error", "Unauthorized",
                "message", errorMessage
            ));
        } catch (Exception e) {
            log.error("Erro durante autenticação: {}", e.getMessage(), e);
            
            String errorMessage = messageService.getErrorMessage("auth.login.failed");
            return ResponseEntity.status(500).body(Map.of(
                "error", "Internal Server Error",
                "message", errorMessage
            ));
        }
    }

    @Operation(
        summary = "Validar token", 
        description = "Valida se o token JWT ainda é válido e retorna informações do usuário"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Token válido",
                content = @Content(mediaType = "application/json",
                    examples = @ExampleObject(value = """
                        {
                            "valid": true,
                            "user": {
                                "username": "admin",
                                "role": "ADMIN",
                                "expiresIn": 3600
                            }
                        }
                        """))),
        @ApiResponse(responseCode = "401", description = "Token inválido ou expirado")
    })
    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                
                if (tokenProvider.validateToken(token)) {
                    String username = tokenProvider.getUsernameFromToken(token);
                    String role = tokenProvider.getRoleFromToken(token);
                    long expiresIn = tokenProvider.getTokenRemainingTime(token);
                    
                    return ResponseEntity.ok(Map.of(
                        "valid", true,
                        "user", Map.of(
                            "username", username,
                            "role", role,
                            "expiresIn", expiresIn
                        )
                    ));
                }
            }
            
            return ResponseEntity.status(401).body(Map.of(
                "valid", false,
                "message", messageService.getErrorMessage("auth.token.invalid")
            ));
            
        } catch (Exception e) {
            log.error("Erro ao validar token: {}", e.getMessage());
            return ResponseEntity.status(401).body(Map.of(
                "valid", false,
                "message", messageService.getErrorMessage("auth.token.invalid")
            ));
        }
    }

    @Operation(
        summary = "Logout", 
        description = "Realiza logout do usuário (invalida token no lado cliente)"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Logout realizado com sucesso",
                content = @Content(mediaType = "application/json",
                    examples = @ExampleObject(value = """
                        {
                            "message": "Logout realizado com sucesso"
                        }
                        """)))
    })
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // Limpar contexto de segurança
        SecurityContextHolder.clearContext();
        
        String message = messageService.getMessage("auth.logout.success", "Logout realizado com sucesso");
        
        return ResponseEntity.ok(Map.of(
            "message", message
        ));
    }

    @Operation(
        summary = "Informações do usuário atual", 
        description = "Retorna informações do usuário atualmente autenticado"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Informações do usuário",
                content = @Content(mediaType = "application/json", 
                    schema = @Schema(implementation = AuthResponse.UserInfo.class))),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado")
    })
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof User user) {
            AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(user);
            return ResponseEntity.ok(userInfo);
        }
        
        return ResponseEntity.status(401).body(Map.of(
            "error", "Unauthorized",
            "message", messageService.getErrorMessage("auth.not.authenticated")
        ));
    }
}