package com.example.ssedemo.repository;

import com.example.ssedemo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository para operações de banco de dados da entidade User.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Busca usuário por username.
     */
    Optional<User> findByUsername(String username);

    /**
     * Busca usuário por email.
     */
    Optional<User> findByEmail(String email);

    /**
     * Busca usuário por username ou email.
     */
    @Query("SELECT u FROM User u WHERE u.username = :login OR u.email = :login")
    Optional<User> findByUsernameOrEmail(@Param("login") String login);

    /**
     * Verifica se username já existe.
     */
    boolean existsByUsername(String username);

    /**
     * Verifica se email já existe.
     */
    boolean existsByEmail(String email);

    /**
     * Busca usuários ativos.
     */
    List<User> findByIsActiveTrue();

    /**
     * Busca usuários por role.
     */
    List<User> findByRole(User.Role role);

    /**
     * Busca usuários ativos por role.
     */
    List<User> findByRoleAndIsActiveTrue(User.Role role);

    /**
     * Busca usuários criados após uma data.
     */
    @Query("SELECT u FROM User u WHERE u.createdAt >= :since ORDER BY u.createdAt DESC")
    List<User> findCreatedAfter(@Param("since") LocalDateTime since);

    /**
     * Conta usuários por role.
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.isActive = true")
    long countByRoleAndActive(@Param("role") User.Role role);

    /**
     * Busca usuários com último login recente.
     */
    @Query("SELECT u FROM User u WHERE u.lastLogin >= :since ORDER BY u.lastLogin DESC")
    List<User> findRecentlyActive(@Param("since") LocalDateTime since);

    /**
     * Busca todos os usuários ordenados por nome.
     */
    @Query("SELECT u FROM User u ORDER BY u.firstName, u.lastName")
    List<User> findAllOrderByName();
}