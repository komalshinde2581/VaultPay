package com.vaultpay.modules.ledger;

import com.vaultpay.common.ErrorCode;
import com.vaultpay.exception.BusinessException;
import com.vaultpay.modules.account.AccountEntity;
import com.vaultpay.modules.transfer.TransactionEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LedgerService {

    private final LedgerRepository ledgerRepository;

    @Transactional
    public void recordDoubleEntry(
            TransactionEntity transaction,
            AccountEntity senderAccount,
            AccountEntity receiverAccount,
            BigDecimal amount,
            BigDecimal senderBalanceAfter,
            BigDecimal receiverBalanceAfter
    ) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Transfer amount must be positive", ErrorCode.INVALID_AMOUNT, HttpStatus.BAD_REQUEST);
        }

        // 1. Immutable DEBIT entry on sender account
        LedgerEntryEntity debitEntry = LedgerEntryEntity.builder()
                .transaction(transaction)
                .account(senderAccount)
                .entryType(EntryType.DEBIT)
                .amount(amount)
                .balanceAfter(senderBalanceAfter)
                .build();

        // 2. Immutable CREDIT entry on receiver account
        LedgerEntryEntity creditEntry = LedgerEntryEntity.builder()
                .transaction(transaction)
                .account(receiverAccount)
                .entryType(EntryType.CREDIT)
                .amount(amount)
                .balanceAfter(receiverBalanceAfter)
                .build();

        // Financial Invariant Verification: Total Debit MUST EQUAL Total Credit
        if (debitEntry.getAmount().compareTo(creditEntry.getAmount()) != 0) {
            throw new BusinessException("Ledger inconsistency detected: Total Debit does not equal Total Credit",
                    ErrorCode.INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        ledgerRepository.save(debitEntry);
        ledgerRepository.save(creditEntry);

        log.info("Recorded double-entry ledger for Tx {}: Debit {} to Acc {}, Credit {} to Acc {}",
                transaction.getReference(), amount, senderAccount.getAccountNumber(), amount, receiverAccount.getAccountNumber());
    }

    @Transactional(readOnly = true)
    public boolean verifyTransactionLedgerBalance(Long transactionId) {
        BigDecimal totalDebit = ledgerRepository.sumAmountByTransactionAndType(transactionId, EntryType.DEBIT);
        BigDecimal totalCredit = ledgerRepository.sumAmountByTransactionAndType(transactionId, EntryType.CREDIT);

        boolean balanced = totalDebit != null && totalCredit != null && totalDebit.compareTo(totalCredit) == 0;
        if (!balanced) {
            log.error("CRITICAL: Ledger imbalance on transaction {}. Debit={}, Credit={}", transactionId, totalDebit, totalCredit);
        }
        return balanced;
    }

    @Transactional(readOnly = true)
    public List<LedgerEntryEntity> getEntriesForTransaction(Long transactionId) {
        return ledgerRepository.findByTransactionId(transactionId);
    }
}
