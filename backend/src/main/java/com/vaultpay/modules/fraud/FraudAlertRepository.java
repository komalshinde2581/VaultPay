package com.vaultpay.modules.fraud;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FraudAlertRepository extends JpaRepository<FraudAlertEntity, Long> {
    Page<FraudAlertEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<FraudAlertEntity> findByStatusOrderByCreatedAtDesc(FraudAlertStatus status, Pageable pageable);
    long countByStatus(FraudAlertStatus status);
}
