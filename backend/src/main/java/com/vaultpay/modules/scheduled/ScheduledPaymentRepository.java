package com.vaultpay.modules.scheduled;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ScheduledPaymentRepository extends JpaRepository<ScheduledPaymentEntity, Long> {
    List<ScheduledPaymentEntity> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<ScheduledPaymentEntity> findByStatusAndNextExecutionDateLessThanEqual(ScheduledStatus status, LocalDate executionDate);
}
