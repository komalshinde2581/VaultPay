package com.vaultpay.service;

import com.vaultpay.exception.BusinessException;
import com.vaultpay.modules.account.AccountEntity;
import com.vaultpay.modules.ledger.EntryType;
import com.vaultpay.modules.ledger.LedgerEntryEntity;
import com.vaultpay.modules.ledger.LedgerRepository;
import com.vaultpay.modules.ledger.LedgerService;
import com.vaultpay.modules.transfer.TransactionEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LedgerServiceTest {

    @Mock
    private LedgerRepository ledgerRepository;

    @InjectMocks
    private LedgerService ledgerService;

    private TransactionEntity transaction;
    private AccountEntity senderAccount;
    private AccountEntity receiverAccount;

    @BeforeEach
    void setUp() {
        transaction = TransactionEntity.builder()
                .id(1L)
                .reference("TX-TEST-001")
                .build();

        senderAccount = AccountEntity.builder()
                .id(101L)
                .accountNumber("VP-1000101")
                .build();

        receiverAccount = AccountEntity.builder()
                .id(102L)
                .accountNumber("VP-2000201")
                .build();
    }

    @Test
    @DisplayName("Should post balanced debit and credit entries where Total Debit equals Total Credit")
    void testRecordDoubleEntry_Success() {
        BigDecimal amount = new BigDecimal("250.0000");
        BigDecimal senderAfter = new BigDecimal("750.0000");
        BigDecimal receiverAfter = new BigDecimal("1250.0000");

        ledgerService.recordDoubleEntry(transaction, senderAccount, receiverAccount, amount, senderAfter, receiverAfter);

        ArgumentCaptor<LedgerEntryEntity> captor = ArgumentCaptor.forClass(LedgerEntryEntity.class);
        verify(ledgerRepository, times(2)).save(captor.capture());

        List<LedgerEntryEntity> savedEntries = captor.getAllValues();
        assertEquals(2, savedEntries.size());

        LedgerEntryEntity debitEntry = savedEntries.stream()
                .filter(e -> e.getEntryType() == EntryType.DEBIT)
                .findFirst().orElseThrow();
        LedgerEntryEntity creditEntry = savedEntries.stream()
                .filter(e -> e.getEntryType() == EntryType.CREDIT)
                .findFirst().orElseThrow();

        // Invariant: Debit amount equals Credit amount
        assertEquals(amount, debitEntry.getAmount());
        assertEquals(amount, creditEntry.getAmount());
        assertEquals(0, debitEntry.getAmount().compareTo(creditEntry.getAmount()));
        assertEquals(senderAccount, debitEntry.getAccount());
        assertEquals(receiverAccount, creditEntry.getAccount());
    }

    @Test
    @DisplayName("Should reject double-entry if transfer amount is negative or zero")
    void testRecordDoubleEntry_InvalidAmount() {
        assertThrows(BusinessException.class, () ->
                ledgerService.recordDoubleEntry(transaction, senderAccount, receiverAccount,
                        BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));

        assertThrows(BusinessException.class, () ->
                ledgerService.recordDoubleEntry(transaction, senderAccount, receiverAccount,
                        new BigDecimal("-50.00"), BigDecimal.ZERO, BigDecimal.ZERO));

        verify(ledgerRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should verify balanced ledger when sum of debit equals sum of credit")
    void testVerifyTransactionLedgerBalance_Balanced() {
        when(ledgerRepository.sumAmountByTransactionAndType(1L, EntryType.DEBIT))
                .thenReturn(new BigDecimal("500.0000"));
        when(ledgerRepository.sumAmountByTransactionAndType(1L, EntryType.CREDIT))
                .thenReturn(new BigDecimal("500.0000"));

        boolean isBalanced = ledgerService.verifyTransactionLedgerBalance(1L);
        assertTrue(isBalanced);
    }
}
