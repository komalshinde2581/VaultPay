package com.vaultpay.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaultpay.exception.AccountFrozenException;
import com.vaultpay.exception.BusinessException;
import com.vaultpay.exception.InsufficientBalanceException;
import com.vaultpay.modules.account.AccountEntity;
import com.vaultpay.modules.account.AccountRepository;
import com.vaultpay.modules.account.AccountStatus;
import com.vaultpay.modules.account.AccountType;
import com.vaultpay.modules.beneficiary.BeneficiaryService;
import com.vaultpay.modules.fraud.FraudEngineService;
import com.vaultpay.modules.ledger.LedgerService;
import com.vaultpay.modules.notification.NotificationService;
import com.vaultpay.modules.outbox.OutboxService;
import com.vaultpay.modules.transfer.IdempotencyService;
import com.vaultpay.modules.transfer.TransactionEntity;
import com.vaultpay.modules.transfer.TransactionRepository;
import com.vaultpay.modules.transfer.TransferService;
import com.vaultpay.modules.transfer.dto.TransferRequest;
import com.vaultpay.modules.transfer.dto.TransferResponse;
import com.vaultpay.modules.user.UserEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransferServiceTest {

    @Mock
    private AccountRepository accountRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private LedgerService ledgerService;
    @Mock
    private IdempotencyService idempotencyService;
    @Mock
    private FraudEngineService fraudEngineService;
    @Mock
    private BeneficiaryService beneficiaryService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private OutboxService outboxService;
    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private TransferService transferService;

    private UserEntity senderUser;
    private UserEntity receiverUser;
    private AccountEntity senderAccount;
    private AccountEntity receiverAccount;

    @BeforeEach
    void setUp() {
        senderUser = UserEntity.builder().id(1L).firstName("Alex").lastName("Mercer").username("alex").build();
        receiverUser = UserEntity.builder().id(2L).firstName("Sarah").lastName("Connor").username("sarah").build();

        senderAccount = AccountEntity.builder()
                .id(101L)
                .accountNumber("VP-1000101")
                .accountType(AccountType.CHECKING)
                .availableBalance(new BigDecimal("1000.0000"))
                .ledgerBalance(new BigDecimal("1000.0000"))
                .status(AccountStatus.ACTIVE)
                .dailyTransferLimit(new BigDecimal("5000.0000"))
                .user(senderUser)
                .build();

        receiverAccount = AccountEntity.builder()
                .id(102L)
                .accountNumber("VP-2000201")
                .accountType(AccountType.CHECKING)
                .availableBalance(new BigDecimal("500.0000"))
                .ledgerBalance(new BigDecimal("500.0000"))
                .status(AccountStatus.ACTIVE)
                .dailyTransferLimit(new BigDecimal("5000.0000"))
                .user(receiverUser)
                .build();
    }

    @Test
    @DisplayName("Should successfully transfer funds and mutate balances atomically")
    void testExecuteTransfer_Success() {
        TransferRequest request = TransferRequest.builder()
                .sourceAccountNumber("VP-1000101")
                .destinationAccountNumber("VP-2000201")
                .amount(new BigDecimal("200.0000"))
                .description("Lunch share")
                .build();

        when(idempotencyService.getValidRecord("IDEMP-KEY-1")).thenReturn(Optional.empty());
        when(accountRepository.findByAccountNumber("VP-1000101")).thenReturn(Optional.of(senderAccount));
        when(accountRepository.findByAccountNumber("VP-2000201")).thenReturn(Optional.of(receiverAccount));
        when(accountRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(senderAccount));
        when(accountRepository.findByIdForUpdate(102L)).thenReturn(Optional.of(receiverAccount));
        when(transactionRepository.save(any(TransactionEntity.class))).thenAnswer(i -> {
            TransactionEntity t = i.getArgument(0);
            t.setId(99L);
            return t;
        });

        TransferResponse response = transferService.executeTransfer(1L, request, "IDEMP-KEY-1");

        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());
        assertEquals(new BigDecimal("200.0000"), response.getAmount());
        assertEquals(new BigDecimal("800.0000"), response.getRemainingBalance());
        assertEquals(new BigDecimal("700.0000"), receiverAccount.getAvailableBalance());

        verify(ledgerService).recordDoubleEntry(any(), eq(senderAccount), eq(receiverAccount),
                eq(new BigDecimal("200.0000")), eq(new BigDecimal("800.0000")), eq(new BigDecimal("700.0000")));
    }

    @Test
    @DisplayName("Should reject transfer if sender has insufficient funds")
    void testExecuteTransfer_InsufficientFunds() {
        TransferRequest request = TransferRequest.builder()
                .sourceAccountNumber("VP-1000101")
                .destinationAccountNumber("VP-2000201")
                .amount(new BigDecimal("5000.0000"))
                .build();

        when(accountRepository.findByAccountNumber("VP-1000101")).thenReturn(Optional.of(senderAccount));
        when(accountRepository.findByAccountNumber("VP-2000201")).thenReturn(Optional.of(receiverAccount));
        when(accountRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(senderAccount));
        when(accountRepository.findByIdForUpdate(102L)).thenReturn(Optional.of(receiverAccount));

        assertThrows(InsufficientBalanceException.class, () ->
                transferService.executeTransfer(1L, request, null));
    }

    @Test
    @DisplayName("Should reject self-transfer between same account")
    void testExecuteTransfer_SelfTransfer() {
        TransferRequest request = TransferRequest.builder()
                .sourceAccountNumber("VP-1000101")
                .destinationAccountNumber("VP-1000101")
                .amount(new BigDecimal("50.0000"))
                .build();

        assertThrows(BusinessException.class, () ->
                transferService.executeTransfer(1L, request, null));
    }

    @Test
    @DisplayName("Should reject transfer if account is frozen")
    void testExecuteTransfer_AccountFrozen() {
        senderAccount.setStatus(AccountStatus.FROZEN);

        TransferRequest request = TransferRequest.builder()
                .sourceAccountNumber("VP-1000101")
                .destinationAccountNumber("VP-2000201")
                .amount(new BigDecimal("50.0000"))
                .build();

        when(accountRepository.findByAccountNumber("VP-1000101")).thenReturn(Optional.of(senderAccount));
        when(accountRepository.findByAccountNumber("VP-2000201")).thenReturn(Optional.of(receiverAccount));

        assertThrows(AccountFrozenException.class, () ->
                transferService.executeTransfer(1L, request, null));
    }
}
