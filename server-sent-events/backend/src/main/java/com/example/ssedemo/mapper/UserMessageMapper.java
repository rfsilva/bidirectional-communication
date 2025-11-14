package com.example.ssedemo.mapper;

import com.example.ssedemo.dto.*;
import com.example.ssedemo.model.User;
import com.example.ssedemo.model.UserMessage;
import com.example.ssedemo.service.UserMessageService;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper para conversão entre entidades UserMessage e DTOs.
 */
@Component
public class UserMessageMapper {

    /**
     * Converte UserMessage entity para UserMessageDTO.
     */
    public UserMessageDTO toDTO(UserMessage entity) {
        if (entity == null) {
            return null;
        }

        return UserMessageDTO.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .content(entity.getContent())
                .type(entity.getType())
                .priority(entity.getPriority())
                .isRead(entity.getIsRead())
                .isExternal(entity.getIsExternal())
                .externalSource(entity.getExternalSource())
                .userId(entity.getUser() != null ? entity.getUser().getId() : null)
                .username(entity.getUser() != null ? entity.getUser().getUsername() : null)
                .userFullName(entity.getUser() != null ? entity.getUser().getFullName() : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .readAt(entity.getReadAt())
                .build();
    }

    /**
     * Converte lista de UserMessage entities para lista de UserMessageDTOs.
     */
    public List<UserMessageDTO> toDTOList(List<UserMessage> entities) {
        if (entities == null) {
            return null;
        }

        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Converte CreateUserMessageRequest para UserMessage entity.
     */
    public UserMessage toEntity(CreateUserMessageRequest request, User user) {
        if (request == null) {
            return null;
        }

        UserMessage entity = new UserMessage();
        entity.setTitle(request.getTitle());
        entity.setContent(request.getContent());
        entity.setType(request.getType() != null ? request.getType() : UserMessage.MessageType.INFO);
        entity.setPriority(request.getPriority() != null ? request.getPriority() : UserMessage.Priority.NORMAL);
        entity.setUser(user);
        entity.setIsRead(false);
        entity.setIsExternal(false);

        return entity;
    }

    /**
     * Atualiza UserMessage entity com dados do UpdateUserMessageRequest.
     */
    public void updateEntity(UserMessage entity, UpdateUserMessageRequest request) {
        if (entity == null || request == null) {
            return;
        }

        if (request.getTitle() != null) {
            entity.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            entity.setContent(request.getContent());
        }
        if (request.getType() != null) {
            entity.setType(request.getType());
        }
        if (request.getPriority() != null) {
            entity.setPriority(request.getPriority());
        }
    }

    /**
     * Converte UserMessageService.UserMessageStats para UserMessageStatsDTO.
     */
    public UserMessageStatsDTO toStatsDTO(UserMessageService.UserMessageStats stats) {
        if (stats == null) {
            return null;
        }

        return UserMessageStatsDTO.builder()
                .totalMessages(stats.getTotalMessages())
                .unreadMessages(stats.getUnreadMessages())
                .readMessages(stats.getTotalMessages() - stats.getUnreadMessages())
                .infoMessages(stats.getInfoMessages())
                .successMessages(stats.getSuccessMessages())
                .warningMessages(stats.getWarningMessages())
                .errorMessages(stats.getErrorMessages())
                .externalMessages(0L) // Será calculado no service se necessário
                .internalMessages(0L) // Será calculado no service se necessário
                .build();
    }

    /**
     * Converte UserMessageService.MessageStats para AdminMessageStatsDTO.
     */
    public AdminMessageStatsDTO toAdminStatsDTO(UserMessageService.MessageStats stats) {
        if (stats == null) {
            return null;
        }

        return AdminMessageStatsDTO.builder()
                .totalMessages(stats.getTotalMessages())
                .unreadMessages(stats.getUnreadMessages())
                .externalMessages(stats.getExternalMessages())
                .totalUsers(0L) // Será calculado no service se necessário
                .lastMessageAt(stats.getLastMessageAt())
                .build();
    }
}