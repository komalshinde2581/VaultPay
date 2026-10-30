package com.vaultpay.modules.scheduled;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScheduledExecutionRepository extends JpaRepository<ScheduledExecutionEntity, Long> {
    List<ScheduledExecutionEntity> findByScheduledPaymentIdOrderByExecutionTimeDesc(Long scheduledPaymentId);
}
