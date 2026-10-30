package com.vaultpay.modules.transfer;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<TransactionEntity, Long> {
    Optional<TransactionEntity> findByReference(String reference);
    Optional<TransactionEntity> findByIdempotencyKey(String idempotencyKey);

    @Query("SELECT t FROM TransactionEntity t WHERE " +
           "(t.senderAccount.id = :accountId OR t.receiverAccount.id = :accountId) " +
           "ORDER BY t.createdAt DESC")
    Page<TransactionEntity> findByAccountId(@Param("accountId") Long accountId, Pageable pageable);

    @Query("SELECT t FROM TransactionEntity t WHERE " +
           "(t.senderAccount.user.id = :userId OR t.receiverAccount.user.id = :userId) " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:startDate IS NULL OR t.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR t.createdAt <= :endDate) " +
           "ORDER BY t.createdAt DESC")
    Page<TransactionEntity> findUserTransactions(
            @Param("userId") Long userId,
            @Param("status") TransactionStatus status,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            Pageable pageable
    );

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM TransactionEntity t " +
           "WHERE t.receiverAccount.user.id = :userId AND t.status = 'SUCCESS' " +
           "AND (:since IS NULL OR t.createdAt >= :since)")
    BigDecimal calculateTotalIncoming(@Param("userId") Long userId, @Param("since") Instant since);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM TransactionEntity t " +
           "WHERE t.senderAccount.user.id = :userId AND t.status = 'SUCCESS' " +
           "AND (:since IS NULL OR t.createdAt >= :since)")
    BigDecimal calculateTotalOutgoing(@Param("userId") Long userId, @Param("since") Instant since);

    @Query("SELECT COUNT(t) FROM TransactionEntity t " +
           "WHERE t.senderAccount.id = :accountId AND t.status = 'SUCCESS' AND t.createdAt >= :since")
    long countRecentTransfersForAccount(@Param("accountId") Long accountId, @Param("since") Instant since);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM TransactionEntity t " +
           "WHERE t.senderAccount.id = :accountId AND t.status = 'SUCCESS' AND t.createdAt >= :since")
    BigDecimal sumRecentTransfersForAccount(@Param("accountId") Long accountId, @Param("since") Instant since);

    @Query("SELECT t FROM TransactionEntity t WHERE " +
           "(:reference IS NULL OR t.reference LIKE CONCAT('%', :reference, '%')) " +
           "ORDER BY t.createdAt DESC")
    Page<TransactionEntity> searchAllTransactions(@Param("reference") String reference, Pageable pageable);
}
