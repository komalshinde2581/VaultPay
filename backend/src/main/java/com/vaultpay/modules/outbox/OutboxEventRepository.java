package com.vaultpay.modules.outbox;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEventEntity, Long> {
    List<OutboxEventEntity> findByStatusAndRetryCountLessThanOrderByCreatedAtAsc(String status, int maxRetries, Pageable pageable);
}
