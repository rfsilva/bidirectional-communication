package com.example.websocketdemo.controller;

import com.example.websocketdemo.dto.*;
import com.example.websocketdemo.mapper.UserMessageMapper;
import com.example.websocketdemo.model.User;
import com.example.websocketdemo.model.UserMessage;
import com.example.websocketdemo.service.ExternalMessageService;
import com.example.websocketdemo.service.UserMessageService;
import com.example.websocketdemo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Controller para gerenciamento de mensagens de usuários.
 * Implementa controle de acesso baseado em roles usando DTOs.
 */
@RestController
@RequestMapping("/api/messages")
@Tag(name = "Mensagens", description = "Endpoints para gerenciamento de mensagens de usuários")
@RequiredArgsConstructor
@Slf4j
public class UserMessageController {

    private final UserMessageService userMessageService;
    private final ExternalMessageService externalMessageService;
    private final UserMessageMapper messageMapper;
    private final UserService userService;

    @Operation(
        summary = "Listar mensagens", 
        description = "Lista mensagens do usuário atual. ADMIN pode ver todas as mensagens, outros usuários veem apenas as próprias."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Mensagens listadas com sucesso"),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping
    public ResponseEntity<List<UserMessageDTO>> getAllMessages(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        List<UserMessage> userMessages = userMessageService.findAllMessages(currentUser);
        List<UserMessageDTO> messageDTOs = messageMapper.toDTOList(userMessages);
        
        log.info("Usuário {} listou {} mensagens", currentUser.getUsername(), messageDTOs.size());
        return ResponseEntity.ok(messageDTOs);
    }

    @Operation(
        summary = "Buscar mensagem por ID", 
        description = "Busca uma mensagem específica. Usuários só podem acessar suas próprias mensagens, ADMIN pode acessar qualquer mensagem."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Mensagem encontrada"),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado"),
        @ApiResponse(responseCode = "404", description = "Mensagem não encontrada")
    })
    @GetMapping("/{id}")
    public ResponseEntity<UserMessageDTO> getMessageById(
            @Parameter(description = "ID da mensagem", required = true)
            @PathVariable Long id,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        
        return userMessageService.findById(id, currentUser)
                .map(userMessage -> {
                    log.info("Usuário {} acessou mensagem ID {}", currentUser.getUsername(), id);
                    UserMessageDTO messageDTO = messageMapper.toDTO(userMessage);
                    return ResponseEntity.ok(messageDTO);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(
        summary = "Listar mensagens de um usuário específico", 
        description = "Lista mensagens de um usuário específico. Apenas ADMIN pode acessar mensagens de outros usuários."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Mensagens listadas com sucesso"),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado - apenas ADMIN ou próprio usuário")
    })
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserMessageDTO>> getMessagesByUserId(
            @Parameter(description = "ID do usuário", required = true)
            @PathVariable Long userId,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        
        try {
            List<UserMessage> userMessages = userMessageService.findMessagesByUserId(userId, currentUser);
            List<UserMessageDTO> messageDTOs = messageMapper.toDTOList(userMessages);
            
            log.info("Usuário {} listou {} mensagens do usuário ID {}", 
                    currentUser.getUsername(), messageDTOs.size(), userId);
            return ResponseEntity.ok(messageDTOs);
        } catch (AccessDeniedException e) {
            log.warn("Acesso negado: {}", e.getMessage());
            return ResponseEntity.status(403).build();
        }
    }

    @Operation(
        summary = "Listar mensagens não lidas", 
        description = "Lista apenas as mensagens não lidas do usuário atual."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Mensagens não lidas listadas com sucesso"),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado")
    })
    @GetMapping("/unread")
    public ResponseEntity<List<UserMessageDTO>> getUnreadMessages(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        List<UserMessage> unreadUserMessages = userMessageService.findUnreadMessages(currentUser);
        List<UserMessageDTO> messageDTOs = messageMapper.toDTOList(unreadUserMessages);
        
        log.info("Usuário {} tem {} mensagens não lidas", currentUser.getUsername(), messageDTOs.size());
        return ResponseEntity.ok(messageDTOs);
    }

    @Operation(
        summary = "Criar nova mensagem", 
        description = "Cria uma nova mensagem para um usuário. Apenas ADMIN pode criar mensagens para outros usuários."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Mensagem criada com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PostMapping
    public ResponseEntity<UserMessageDTO> createMessage(
            @Parameter(description = "Dados da mensagem", required = true)
            @Valid @RequestBody CreateUserMessageRequest request,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        
        // Verificar se usuário pode criar mensagem para o destinatário especificado
        if (!currentUser.getId().equals(request.getUserId()) && currentUser.getRole() != User.Role.ADMIN) {
            log.warn("Usuário {} tentou criar mensagem para outro usuário - ACESSO NEGADO", 
                    currentUser.getUsername());
            return ResponseEntity.status(403).build();
        }
        
        // Buscar usuário destinatário
        User targetUser = userService.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + request.getUserId()));
        
        // Converter DTO para entity e criar mensagem
        UserMessage userMessage = messageMapper.toEntity(request, targetUser);
        UserMessage savedMessage = userMessageService.createMessage(userMessage);
        UserMessageDTO messageDTO = messageMapper.toDTO(savedMessage);
        
        log.info("Mensagem criada pelo usuário {} para usuário ID {}", 
                currentUser.getUsername(), request.getUserId());
        
        return ResponseEntity.status(201).body(messageDTO);
    }

    @Operation(
        summary = "Atualizar mensagem", 
        description = "Atualiza uma mensagem existente. Usuários só podem atualizar suas próprias mensagens, ADMIN pode atualizar qualquer mensagem."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Mensagem atualizada com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado"),
        @ApiResponse(responseCode = "404", description = "Mensagem não encontrada")
    })
    @PutMapping("/{id}")
    public ResponseEntity<UserMessageDTO> updateMessage(
            @Parameter(description = "ID da mensagem", required = true)
            @PathVariable Long id,
            @Parameter(description = "Dados atualizados da mensagem", required = true)
            @Valid @RequestBody UpdateUserMessageRequest request,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        
        try {
            // Buscar mensagem existente
            UserMessage existingMessage = userMessageService.findById(id, currentUser)
                    .orElseThrow(() -> new IllegalArgumentException("Mensagem não encontrada: " + id));
            
            // Atualizar entity com dados do DTO
            messageMapper.updateEntity(existingMessage, request);
            
            // Salvar e converter para DTO
            UserMessage updatedMessage = userMessageService.updateMessage(id, existingMessage, currentUser);
            UserMessageDTO messageDTO = messageMapper.toDTO(updatedMessage);
            
            log.info("Mensagem ID {} atualizada pelo usuário {}", id, currentUser.getUsername());
            return ResponseEntity.ok(messageDTO);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (AccessDeniedException e) {
            log.warn("Acesso negado: {}", e.getMessage());
            return ResponseEntity.status(403).build();
        }
    }

    @Operation(
        summary = "Excluir mensagem", 
        description = "Exclui uma mensagem. Usuários só podem excluir suas próprias mensagens, ADMIN pode excluir qualquer mensagem."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Mensagem excluída com sucesso"),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado"),
        @ApiResponse(responseCode = "404", description = "Mensagem não encontrada")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMessage(
            @Parameter(description = "ID da mensagem", required = true)
            @PathVariable Long id,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        
        try {
            userMessageService.deleteMessage(id, currentUser);
            log.info("Mensagem ID {} excluída pelo usuário {}", id, currentUser.getUsername());
            return ResponseEntity.noContent().build();
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (AccessDeniedException e) {
            log.warn("Acesso negado: {}", e.getMessage());
            return ResponseEntity.status(403).build();
        }
    }

    @Operation(
        summary = "Marcar mensagem como lida", 
        description = "Marca uma mensagem como lida."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Mensagem marcada como lida"),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado"),
        @ApiResponse(responseCode = "404", description = "Mensagem não encontrada")
    })
    @PatchMapping("/{id}/read")
    public ResponseEntity<UserMessageDTO> markAsRead(
            @Parameter(description = "ID da mensagem", required = true)
            @PathVariable Long id,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        
        try {
            UserMessage userMessage = userMessageService.markAsRead(id, currentUser);
            UserMessageDTO messageDTO = messageMapper.toDTO(userMessage);
            return ResponseEntity.ok(messageDTO);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).build();
        }
    }

    @Operation(
        summary = "Marcar mensagem como não lida", 
        description = "Marca uma mensagem como não lida."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Mensagem marcada como não lida"),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado"),
        @ApiResponse(responseCode = "404", description = "Mensagem não encontrada")
    })
    @PatchMapping("/{id}/unread")
    public ResponseEntity<UserMessageDTO> markAsUnread(
            @Parameter(description = "ID da mensagem", required = true)
            @PathVariable Long id,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        
        try {
            UserMessage userMessage = userMessageService.markAsUnread(id, currentUser);
            UserMessageDTO messageDTO = messageMapper.toDTO(userMessage);
            return ResponseEntity.ok(messageDTO);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).build();
        }
    }

    @Operation(
        summary = "Marcar todas as mensagens como lidas", 
        description = "Marca todas as mensagens do usuário atual como lidas."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Todas as mensagens marcadas como lidas"),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado")
    })
    @PatchMapping("/mark-all-read")
    public ResponseEntity<Map<String, Object>> markAllAsRead(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        
        long unreadCount = userMessageService.countUnreadMessages(currentUser);
        userMessageService.markAllAsRead(currentUser);
        
        return ResponseEntity.ok(Map.of(
            "message", "Todas as mensagens foram marcadas como lidas",
            "markedCount", unreadCount
        ));
    }

    @Operation(
        summary = "Estatísticas de mensagens", 
        description = "Retorna estatísticas das mensagens do usuário atual."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Estatísticas retornadas com sucesso"),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado")
    })
    @GetMapping("/stats")
    public ResponseEntity<UserMessageStatsDTO> getMessageStats(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        UserMessageService.UserMessageStats stats = userMessageService.getUserMessageStats(currentUser);
        UserMessageStatsDTO statsDTO = messageMapper.toStatsDTO(stats);
        
        return ResponseEntity.ok(statsDTO);
    }

    @Operation(
        summary = "Estatísticas gerais de mensagens (ADMIN)", 
        description = "Retorna estatísticas gerais de todas as mensagens. Apenas para ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Estatísticas gerais retornadas com sucesso"),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado - apenas ADMIN")
    })
    @GetMapping("/stats/admin")
    public ResponseEntity<AdminMessageStatsDTO> getAdminMessageStats(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        
        try {
            UserMessageService.MessageStats stats = userMessageService.getMessageStats(currentUser);
            AdminMessageStatsDTO statsDTO = messageMapper.toAdminStatsDTO(stats);
            return ResponseEntity.ok(statsDTO);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).build();
        }
    }

    @Operation(
        summary = "Forçar busca de mensagens externas", 
        description = "Força uma busca manual de mensagens de sistemas externos. Apenas para ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Busca executada com sucesso"),
        @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado - apenas ADMIN"),
        @ApiResponse(responseCode = "500", description = "Erro na busca de mensagens externas")
    })
    @PostMapping("/external/force-fetch")
    public ResponseEntity<Map<String, Object>> forceExternalMessageFetch(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        
        if (currentUser.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }
        
        try {
            List<UserMessage> newUserMessages = externalMessageService.forceExternalMessageFetch();
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Busca de mensagens externas executada com sucesso",
                "messagesImported", newUserMessages.size(),
                "timestamp", LocalDateTime.now()
            ));
            
        } catch (Exception e) {
            log.error("Erro na busca forçada de mensagens externas", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", "Erro ao buscar mensagens externas",
                "error", e.getMessage()
            ));
        }
    }

    // 🆕 Endpoint para criar mensagem de teste com notificação SSE
    @Operation(
        summary = "Criar mensagem de teste (ADMIN)", 
        description = "Cria uma mensagem de teste para um usuário específico e envia notificação SSE. Apenas para ADMIN."
    )
    @PostMapping("/test/{userId}")
    public ResponseEntity<Map<String, Object>> createTestMessage(
            @Parameter(description = "ID do usuário destinatário", required = true)
            @PathVariable Long userId,
            @RequestBody(required = false) Map<String, String> request,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        
        if (currentUser.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of(
                "status", "error",
                "message", "Apenas administradores podem criar mensagens de teste"
            ));
        }
        
        try {
            // Obter dados da requisição ou usar valores padrão
            String title = request != null ? request.getOrDefault("title", "Mensagem de Teste") : "Mensagem de Teste";
            String content = request != null ? request.getOrDefault("content", "Esta é uma mensagem de teste enviada pelo administrador.") : "Esta é uma mensagem de teste enviada pelo administrador.";
            String typeStr = request != null ? request.getOrDefault("type", "INFO") : "INFO";
            String priorityStr = request != null ? request.getOrDefault("priority", "NORMAL") : "NORMAL";
            
            UserMessage.MessageType type;
            UserMessage.Priority priority;
            
            try {
                type = UserMessage.MessageType.valueOf(typeStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                type = UserMessage.MessageType.INFO;
            }
            
            try {
                priority = UserMessage.Priority.valueOf(priorityStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                priority = UserMessage.Priority.NORMAL;
            }
            
            // Criar mensagem de teste
            UserMessage testMessage = externalMessageService.createCustomTestMessage(
                userId, title, content, type, priority
            );
            
            log.info("ADMIN {} criou mensagem de teste para usuário ID {}: {}", 
                    currentUser.getUsername(), userId, title);
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Mensagem de teste criada e notificação SSE enviada",
                "messageId", testMessage.getId(),
                "title", testMessage.getTitle(),
                "targetUserId", userId,
                "timestamp", LocalDateTime.now()
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Erro ao criar mensagem de teste", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", "Erro interno do servidor",
                "error", e.getMessage()
            ));
        }
    }
}
