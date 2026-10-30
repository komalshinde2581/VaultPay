package com.vaultpay.modules.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoginHistoryRepository extends JpaRepository<LoginHistoryEntity, Long> {
    Page<LoginHistoryEntity> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<LoginHistoryEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
