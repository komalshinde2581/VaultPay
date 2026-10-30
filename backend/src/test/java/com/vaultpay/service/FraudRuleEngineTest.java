package com.vaultpay.service;

import com.vaultpay.exception.BusinessException;
import com.vaultpay.modules.account.AccountEntity;
import com.vaultpay.modules.fraud.FraudAlertEntity;
import com.vaultpay.modules.fraud.FraudAlertRepository;
import com.vaultpay.modules.fraud.FraudEngineService;
import com.vaultpay.modules.fraud.FraudRiskLevel;
import com.vaultpay.modules.transfer.TransactionRepository;
import com.vaultpay.modules.user.UserEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FraudRuleEngineTest {

    @Mock
    private FraudAlertRepository fraudAlertRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private FraudEngineService fraudEngineService;

    private AccountEntity senderAccount;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(fraudEngineService, "largeTransferThreshold", new BigDecimal("10000.00"));
        ReflectionTestUtils.setField(fraudEngineService, "rapidTransferCount", 3);
        ReflectionTestUtils.setField(fraudEngineService, "rapidTransferWindowMinutes", 5);
        ReflectionTestUtils.setField(fraudEngineService, "dailyVelocityLimit", new BigDecimal("25000.00"));

        UserEntity user = UserEntity.builder().id(1L).username("testuser").build();
        senderAccount = AccountEntity.builder()
                .id(101L)
                .accountNumber("VP-1000101")
                .user(user)
                .dailyTransferLimit(new BigDecimal("15000.00"))
                .build();
    }

    @Test
    @DisplayName("Should block transfer exceeding account daily limit")
    void testEvaluateTransfer_ExceedsDailyLimit() {
        BigDecimal overLimit = new BigDecimal("20000.00");

        assertThrows(BusinessException.class, () ->
                fraudEngineService.evaluateTransfer(senderAccount, overLimit));
    }

    @Test
    @DisplayName("Should trigger high-amount fraud alert when transfer exceeds 10,000 threshold")
    void testEvaluateTransfer_HighAmountTrigger() {
        BigDecimal largeAmount = new BigDecimal("12000.00");
        when(transactionRepository.countRecentTransfersForAccount(eq(101L), any(Instant.class))).thenReturn(0L);
        when(transactionRepository.sumRecentTransfersForAccount(eq(101L), any(Instant.class))).thenReturn(BigDecimal.ZERO);

        fraudEngineService.evaluateTransfer(senderAccount, largeAmount);

        verify(fraudAlertRepository, atLeastOnce()).save(any(FraudAlertEntity.class));
    }
}
