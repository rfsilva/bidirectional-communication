package com.example.ssedemo.service;

import com.example.ssedemo.model.DataEntity;
import com.example.ssedemo.repository.DataEntityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Serviço para gerenciamento de dados.
 * Utiliza Lombok para reduzir boilerplate code.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DataService {

    private final DataEntityRepository repository;

    /**
     * Busca todos os dados ordenados por data de criação (mais recentes primeiro).
     *
     * @return Lista de todas as entidades
     */
    public List<DataEntity> findAll() {
        return repository.findAllOrderByCreatedAtDesc();
    }

    /**
     * Busca uma entidade por ID.
     *
     * @param id ID da entidade
     * @return Optional contendo a entidade se encontrada
     */
    public Optional<DataEntity> findById(Long id) {
        return repository.findById(id);
    }

    /**
     * Salva uma entidade.
     *
     * @param entity Entidade a ser salva
     * @return Entidade salva
     */
    public DataEntity save(DataEntity entity) {
        log.debug("Salvando entidade: {}", entity.getName());
        return repository.save(entity);
    }

    /**
     * Salva múltiplas entidades.
     *
     * @param entities Lista de entidades a serem salvas
     * @return Lista de entidades salvas
     */
    public List<DataEntity> saveAll(List<DataEntity> entities) {
        log.debug("Salvando {} entidades", entities.size());
        return repository.saveAll(entities);
    }

    /**
     * Remove uma entidade por ID.
     *
     * @param id ID da entidade a ser removida
     */
    public void deleteById(Long id) {
        log.debug("Removendo entidade com ID: {}", id);
        repository.deleteById(id);
    }

    /**
     * Verifica se uma entidade existe por ID.
     *
     * @param id ID da entidade
     * @return true se a entidade existe, false caso contrário
     */
    public boolean existsById(Long id) {
        return repository.existsById(id);
    }

    /**
     * Busca apenas dados externos.
     *
     * @return Lista de dados externos
     */
    public List<DataEntity> findExternalData() {
        return repository.findByIsExternalTrue();
    }

    /**
     * Busca apenas dados internos.
     *
     * @return Lista de dados internos
     */
    public List<DataEntity> findInternalData() {
        return repository.findByIsExternalFalse();
    }

    /**
     * Busca dados criados após uma data específica.
     *
     * @param since Data de referência
     * @return Lista de dados criados após a data
     */
    public List<DataEntity> findCreatedAfter(LocalDateTime since) {
        return repository.findCreatedAfter(since);
    }

    /**
     * Conta quantos dados foram criados após uma data específica.
     *
     * @param since Data de referência
     * @return Quantidade de dados criados após a data
     */
    public long countCreatedAfter(LocalDateTime since) {
        return repository.countCreatedAfter(since);
    }

    /**
     * Obtém a data de criação do último registro.
     *
     * @return Data de criação do último registro ou null se não houver dados
     */
    public LocalDateTime getLastCreatedAt() {
        return repository.findLastCreatedAt();
    }

    /**
     * Obtém o total de registros.
     *
     * @return Quantidade total de registros
     */
    public long getTotalCount() {
        return repository.count();
    }
}