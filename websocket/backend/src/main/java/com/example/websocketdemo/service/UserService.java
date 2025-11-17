package com.example.websocketdemo.service;

import com.example.websocketdemo.model.User;
import com.example.websocketdemo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Serviço para gerenciamento de usuários.
 * Implementa UserDetailsService para integração com Spring Security.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MessageService messageService;

    /**
     * Implementação do UserDetailsService para Spring Security.
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("Carregando usuário: {}", username);
        
        return userRepository.findByUsernameOrEmail(username)
                .orElseThrow(() -> {
                    String message = messageService.getErrorMessage("user.not.found", username);
                    log.warn("Usuário não encontrado: {}", username);
                    return new UsernameNotFoundException(message);
                });
    }

    /**
     * Busca todos os usuários.
     */
    @Transactional(readOnly = true)
    public List<User> findAll() {
        return userRepository.findAllOrderByName();
    }

    /**
     * Busca usuário por ID.
     */
    @Transactional(readOnly = true)
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    /**
     * Busca usuário por username.
     */
    @Transactional(readOnly = true)
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    /**
     * Busca usuário por email.
     */
    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Busca usuário por username ou email.
     */
    @Transactional(readOnly = true)
    public Optional<User> findByUsernameOrEmail(String login) {
        return userRepository.findByUsernameOrEmail(login);
    }

    /**
     * Cria um novo usuário.
     */
    public User createUser(User user) {
        log.info("Criando novo usuário: {}", user.getUsername());

        // Validar se username já existe
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException(
                messageService.getErrorMessage("user.username.exists", user.getUsername())
            );
        }

        // Validar se email já existe
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException(
                messageService.getErrorMessage("user.email.exists", user.getEmail())
            );
        }

        // Criptografar senha
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // Definir valores padrão
        if (user.getIsActive() == null) {
            user.setIsActive(true);
        }
        
        User savedUser = userRepository.save(user);
        log.info("Usuário criado com sucesso: {} (ID: {})", savedUser.getUsername(), savedUser.getId());
        
        return savedUser;
    }

    /**
     * Atualiza um usuário existente.
     */
    public User updateUser(Long id, User userUpdate) {
        log.info("Atualizando usuário ID: {}", id);

        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                    messageService.getErrorMessage("user.not.found.id", id)
                ));

        // Validar username único (se mudou)
        if (!existingUser.getUsername().equals(userUpdate.getUsername()) &&
            userRepository.existsByUsername(userUpdate.getUsername())) {
            throw new IllegalArgumentException(
                messageService.getErrorMessage("user.username.exists", userUpdate.getUsername())
            );
        }

        // Validar email único (se mudou)
        if (!existingUser.getEmail().equals(userUpdate.getEmail()) &&
            userRepository.existsByEmail(userUpdate.getEmail())) {
            throw new IllegalArgumentException(
                messageService.getErrorMessage("user.email.exists", userUpdate.getEmail())
            );
        }

        // Atualizar campos
        existingUser.setUsername(userUpdate.getUsername());
        existingUser.setEmail(userUpdate.getEmail());
        existingUser.setFirstName(userUpdate.getFirstName());
        existingUser.setLastName(userUpdate.getLastName());
        existingUser.setRole(userUpdate.getRole());
        existingUser.setAvatarUrl(userUpdate.getAvatarUrl());
        existingUser.setIsActive(userUpdate.getIsActive());

        // Atualizar senha se fornecida
        if (userUpdate.getPassword() != null && !userUpdate.getPassword().isEmpty()) {
            existingUser.setPassword(passwordEncoder.encode(userUpdate.getPassword()));
        }

        User savedUser = userRepository.save(existingUser);
        log.info("Usuário atualizado: {} (ID: {})", savedUser.getUsername(), savedUser.getId());
        
        return savedUser;
    }

    /**
     * Atualiza apenas a senha do usuário.
     */
    public void updatePassword(Long userId, String newPassword) {
        log.info("Atualizando senha do usuário ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                    messageService.getErrorMessage("user.not.found.id", userId)
                ));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        log.info("Senha atualizada para usuário: {}", user.getUsername());
    }

    /**
     * Desativa um usuário (soft delete).
     */
    public void deactivateUser(Long id) {
        log.info("Desativando usuário ID: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                    messageService.getErrorMessage("user.not.found.id", id)
                ));

        user.setIsActive(false);
        userRepository.save(user);
        
        log.info("Usuário desativado: {}", user.getUsername());
    }

    /**
     * Ativa um usuário.
     */
    public void activateUser(Long id) {
        log.info("Ativando usuário ID: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                    messageService.getErrorMessage("user.not.found.id", id)
                ));

        user.setIsActive(true);
        userRepository.save(user);
        
        log.info("Usuário ativado: {}", user.getUsername());
    }

    /**
     * Atualiza último login do usuário.
     */
    public void updateLastLogin(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            user.updateLastLogin();
            userRepository.save(user);
            log.debug("Último login atualizado para: {}", username);
        });
    }

    /**
     * Busca usuários por role.
     */
    @Transactional(readOnly = true)
    public List<User> findByRole(User.Role role) {
        return userRepository.findByRoleAndIsActiveTrue(role);
    }

    /**
     * Busca usuários ativos.
     */
    @Transactional(readOnly = true)
    public List<User> findActiveUsers() {
        return userRepository.findByIsActiveTrue();
    }

    /**
     * Conta usuários por role.
     */
    @Transactional(readOnly = true)
    public long countByRole(User.Role role) {
        return userRepository.countByRoleAndActive(role);
    }

    /**
     * Busca usuários recentemente ativos.
     */
    @Transactional(readOnly = true)
    public List<User> findRecentlyActive(LocalDateTime since) {
        return userRepository.findRecentlyActive(since);
    }

    /**
     * Verifica se usuário existe.
     */
    @Transactional(readOnly = true)
    public boolean existsById(Long id) {
        return userRepository.existsById(id);
    }

    /**
     * Verifica se username existe.
     */
    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    /**
     * Verifica se email existe.
     */
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}
