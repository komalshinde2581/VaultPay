package com.vaultpay.modules.audit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Async
    @Transactional
    public void logAction(Long userId, String username, String action, String resourceType, String resourceId, String ipAddress, String details, String status) {
        try {
            AuditLogEntity logEntry = AuditLogEntity.builder()
                    .userId(userId)
                    .username(username)
                    .action(action)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .ipAddress(ipAddress)
                    .details(details)
                    .status(status != null ? status : "SUCCESS")
                    .build();

            auditLogRepository.save(logEntry);
            log.info("AUDIT: User={} Action={} Target={}/{} Status={}", username, action, resourceType, resourceId, status);
        } catch (Exception e) {
            log.error("Failed to persist audit log entry", e);
        }
    }

    @Transactional(readOnly = true)
    public Page<AuditLogEntity> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
}
