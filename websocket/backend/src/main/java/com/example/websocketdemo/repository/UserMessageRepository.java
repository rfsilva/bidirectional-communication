package com.example.websocketdemo.repository;

import com.example.websocketdemo.model.UserMessage;
import com.example.websocketdemo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository para operações com mensagens.
 * Todas as queries fazem JOIN FETCH com User para evitar LazyInitializationException.
 */
@Repository
public interface UserMessageRepository extends JpaRepository<UserMessage, Long> {

    /**
     * Busca mensagem por ID com JOIN FETCH do User.
     */
    @Query("SELECT m FROM UserMessage m JOIN FETCH m.user WHERE m.id = :id")
    Optional<UserMessage> findByIdWithUser(@Param("id") Long id);

    /**
     * Busca mensagens por usuário ordenadas por data de criação (mais recentes primeiro).
     */
    @Query("SELECT m FROM UserMessage m JOIN FETCH m.user u WHERE u = :user ORDER BY m.createdAt DESC")
    List<UserMessage> findByUserOrderByCreatedAtDesc(@Param("user") User user);

    /**
     * Busca mensagens por ID do usuário ordenadas por data de criação (mais recentes primeiro).
     */
    @Query("SELECT m FROM UserMessage m JOIN FETCH m.user u WHERE u.id = :userId ORDER BY m.createdAt DESC")
    List<UserMessage> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    /**
     * Busca mensagens não lidas por usuário.
     */
    @Query("SELECT m FROM UserMessage m JOIN FETCH m.user u WHERE u = :user AND m.isRead = false ORDER BY m.createdAt DESC")
    List<UserMessage> findByUserAndIsReadFalseOrderByCreatedAtDesc(@Param("user") User user);

    /**
     * Busca mensagens não lidas por ID do usuário.
     */
    @Query("SELECT m FROM UserMessage m JOIN FETCH m.user u WHERE u.id = :userId AND m.isRead = false ORDER BY m.createdAt DESC")
    List<UserMessage> findUnreadByUserId(@Param("userId") Long userId);

    /**
     * Busca mensagens por tipo e usuário.
     */
    @Query("SELECT m FROM UserMessage m JOIN FETCH m.user u WHERE u = :user AND m.type = :type ORDER BY m.createdAt DESC")
    List<UserMessage> findByUserAndTypeOrderByCreatedAtDesc(@Param("user") User user, @Param("type") UserMessage.MessageType type);

    /**
     * Busca mensagens por prioridade e usuário.
     */
    @Query("SELECT m FROM UserMessage m JOIN FETCH m.user u WHERE u = :user AND m.priority = :priority ORDER BY m.createdAt DESC")
    List<UserMessage> findByUserAndPriorityOrderByCreatedAtDesc(@Param("user") User user, @Param("priority") UserMessage.Priority priority);

    /**
     * Busca mensagens externas por usuário.
     */
    @Query("SELECT m FROM UserMessage m JOIN FETCH m.user u WHERE u = :user AND m.isExternal = true ORDER BY m.createdAt DESC")
    List<UserMessage> findByUserAndIsExternalTrueOrderByCreatedAtDesc(@Param("user") User user);

    /**
     * Busca mensagens internas por usuário.
     */
    @Query("SELECT m FROM UserMessage m JOIN FETCH m.user u WHERE u = :user AND m.isExternal = false ORDER BY m.createdAt DESC")
    List<UserMessage> findByUserAndIsExternalFalseOrderByCreatedAtDesc(@Param("user") User user);

    /**
     * Busca todas as mensagens ordenadas por data (para ADMIN).
     */
    @Query("SELECT m FROM UserMessage m JOIN FETCH m.user ORDER BY m.createdAt DESC")
    List<UserMessage> findAllOrderByCreatedAtDesc();

    /**
     * Busca mensagens criadas após uma data específica.
     */
    @Query("SELECT m FROM UserMessage m JOIN FETCH m.user WHERE m.createdAt >= :since ORDER BY m.createdAt DESC")
    List<UserMessage> findCreatedAfter(@Param("since") LocalDateTime since);

    /**
     * Busca mensagens criadas após uma data específica para um usuário.
     */
    @Query("SELECT m FROM UserMessage m JOIN FETCH m.user u WHERE u.id = :userId AND m.createdAt >= :since ORDER BY m.createdAt DESC")
    List<UserMessage> findByUserIdAndCreatedAfter(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    /**
     * Busca mensagens por fonte externa.
     */
    @Query("SELECT m FROM UserMessage m JOIN FETCH m.user WHERE m.externalSource = :source ORDER BY m.createdAt DESC")
    List<UserMessage> findByExternalSource(@Param("source") String source);

    /**
     * Busca últimas mensagens por usuário (limitado).
     */
    @Query("SELECT m FROM UserMessage m JOIN FETCH m.user u WHERE u.id = :userId ORDER BY m.createdAt DESC LIMIT :limit")
    List<UserMessage> findLatestByUserId(@Param("userId") Long userId, @Param("limit") int limit);

    /**
     * Busca mensagens por múltiplos usuários (para ADMIN).
     */
    @Query("SELECT m FROM UserMessage m JOIN FETCH m.user u WHERE u.id IN :userIds ORDER BY m.createdAt DESC")
    List<UserMessage> findByUserIds(@Param("userIds") List<Long> userIds);

    // ===== QUERIES DE CONTAGEM (não precisam de JOIN FETCH) =====

    /**
     * Conta mensagens não lidas por usuário.
     */
    @Query("SELECT COUNT(m) FROM UserMessage m WHERE m.user.id = :userId AND m.isRead = false")
    long countUnreadByUserId(@Param("userId") Long userId);

    /**
     * Conta total de mensagens por usuário.
     */
    @Query("SELECT COUNT(m) FROM UserMessage m WHERE m.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);

    /**
     * Conta mensagens por tipo para um usuário.
     */
    @Query("SELECT COUNT(m) FROM UserMessage m WHERE m.user.id = :userId AND m.type = :type")
    long countByUserIdAndType(@Param("userId") Long userId, @Param("type") UserMessage.MessageType type);

    /**
     * Estatísticas gerais de mensagens.
     */
    @Query("SELECT COUNT(m) FROM UserMessage m")
    long countAllMessages();

    @Query("SELECT COUNT(m) FROM UserMessage m WHERE m.isRead = false")
    long countAllUnreadMessages();

    @Query("SELECT COUNT(m) FROM UserMessage m WHERE m.isExternal = true")
    long countExternalMessages();

    @Query("SELECT MAX(m.createdAt) FROM UserMessage m")
    LocalDateTime findLastCreatedAt();
}
