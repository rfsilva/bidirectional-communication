package com.example.websocketdemo.service;

import com.example.websocketdemo.model.DataEntity;
import com.example.websocketdemo.repository.DataEntityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class DataService {

    @Autowired
    private DataEntityRepository repository;

    public List<DataEntity> findAll() {
        return repository.findAllOrderByCreatedAtDesc();
    }

    public Optional<DataEntity> findById(Long id) {
        return repository.findById(id);
    }

    public DataEntity save(DataEntity entity) {
        return repository.save(entity);
    }

    public List<DataEntity> saveAll(List<DataEntity> entities) {
        return repository.saveAll(entities);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    public boolean existsById(Long id) {
        return repository.existsById(id);
    }

    public List<DataEntity> findExternalData() {
        return repository.findByIsExternalTrue();
    }

    public List<DataEntity> findInternalData() {
        return repository.findByIsExternalFalse();
    }

    public List<DataEntity> findCreatedAfter(LocalDateTime since) {
        return repository.findCreatedAfter(since);
    }

    public long countCreatedAfter(LocalDateTime since) {
        return repository.countCreatedAfter(since);
    }

    public long getTotalCount() {
        return repository.count();
    }

    public LocalDateTime getLastCreatedAt() {
        return repository.findLastCreatedAt();
    }
}