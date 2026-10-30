package com.vaultpay.modules.ledger;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface LedgerRepository extends JpaRepository<LedgerEntryEntity, Long> {
    List<LedgerEntryEntity> findByTransactionId(Long transactionId);
    Page<LedgerEntryEntity> findByAccountIdOrderByCreatedAtDesc(Long accountId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(l.amount), 0) FROM LedgerEntryEntity l WHERE l.transaction.id = :transactionId AND l.entryType = :entryType")
    BigDecimal sumAmountByTransactionAndType(@Param("transactionId") Long transactionId, @Param("entryType") EntryType entryType);

    @Query("SELECT COUNT(l) FROM LedgerEntryEntity l")
    long countTotalEntries();
}
