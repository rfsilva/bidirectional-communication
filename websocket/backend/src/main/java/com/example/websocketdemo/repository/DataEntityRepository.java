package com.example.websocketdemo.repository;

import com.example.websocketdemo.model.DataEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DataEntityRepository extends JpaRepository<DataEntity, Long> {

    List<DataEntity> findByIsExternalTrue();

    List<DataEntity> findByIsExternalFalse();

    @Query("SELECT d FROM DataEntity d WHERE d.createdAt >= :since ORDER BY d.createdAt DESC")
    List<DataEntity> findCreatedAfter(@Param("since") LocalDateTime since);

    @Query("SELECT d FROM DataEntity d ORDER BY d.createdAt DESC")
    List<DataEntity> findAllOrderByCreatedAtDesc();

    @Query("SELECT COUNT(d) FROM DataEntity d WHERE d.createdAt >= :since")
    long countCreatedAfter(@Param("since") LocalDateTime since);

    @Query("SELECT MAX(d.createdAt) FROM DataEntity d")
    LocalDateTime findLastCreatedAt();
}