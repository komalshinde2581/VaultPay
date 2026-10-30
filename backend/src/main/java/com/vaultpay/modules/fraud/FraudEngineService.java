package com.vaultpay.modules.fraud;

import com.vaultpay.common.ErrorCode;
import com.vaultpay.exception.BusinessException;
import com.vaultpay.modules.account.AccountEntity;
import com.vaultpay.modules.transfer.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class FraudEngineService {

    private final FraudAlertRepository fraudAlertRepository;
    private final TransactionRepository transactionRepository;

    @Value("${vaultpay.fraud.large-transfer-threshold:10000.00}")
    private BigDecimal largeTransferThreshold;

    @Value("${vaultpay.fraud.rapid-transfer-count:3}")
    private int rapidTransferCount;

    @Value("${vaultpay.fraud.rapid-transfer-window-minutes:5}")
    private int rapidTransferWindowMinutes;

    @Value("${vaultpay.fraud.daily-velocity-limit:25000.00}")
    private BigDecimal dailyVelocityLimit;

    @Transactional
    public void evaluateTransfer(AccountEntity senderAccount, BigDecimal amount) {
        // Rule 0: Hard Limit Check - cannot exceed single or daily transfer limit
        if (amount.compareTo(senderAccount.getDailyTransferLimit()) > 0) {
            log.warn("Transfer amount {} exceeds account daily limit {}", amount, senderAccount.getDailyTransferLimit());
            triggerAlert(senderAccount, null, "ACCOUNT_DAILY_LIMIT_EXCEEDED", FraudRiskLevel.HIGH,
                    String.format("Transfer amount (₹%s) exceeds configured account transfer limit (₹%s)", amount, senderAccount.getDailyTransferLimit()));
            throw new BusinessException("Transfer exceeds account daily transfer limit of ₹" + senderAccount.getDailyTransferLimit(),
                    ErrorCode.DAILY_LIMIT_EXCEEDED, HttpStatus.BAD_REQUEST);
        }

        // Rule 1: High Amount Warning / Audit Alert
        if (amount.compareTo(largeTransferThreshold) >= 0) {
            log.warn("High value transaction detected: amount={} threshold={}", amount, largeTransferThreshold);
            triggerAlert(senderAccount, null, "UNUSUALLY_LARGE_TRANSACTION", FraudRiskLevel.HIGH,
                    String.format("Single transfer amount (₹%s) exceeds standard audit threshold (₹%s)", amount, largeTransferThreshold));
        }

        // Rule 2: Rapid Burst Velocity (e.g. 3 transfers within 5 minutes)
        Instant rapidWindowStart = Instant.now().minus(rapidTransferWindowMinutes, ChronoUnit.MINUTES);
        long recentCount = transactionRepository.countRecentTransfersForAccount(senderAccount.getId(), rapidWindowStart);
        if (recentCount >= rapidTransferCount) {
            log.warn("High velocity transfers detected: count={} in window={}min", recentCount, rapidTransferWindowMinutes);
            triggerAlert(senderAccount, null, "RAPID_TRANSACTION_FREQUENCY", FraudRiskLevel.MEDIUM,
                    String.format("Account initiated %d transfers within the last %d minutes", recentCount + 1, rapidTransferWindowMinutes));
        }

        // Rule 3: 24-hour aggregate velocity threshold
        Instant dayStart = Instant.now().minus(24, ChronoUnit.HOURS);
        BigDecimal past24hSum = transactionRepository.sumRecentTransfersForAccount(senderAccount.getId(), dayStart);
        if (past24hSum.add(amount).compareTo(dailyVelocityLimit) > 0) {
            log.warn("24-hour velocity limit warning: total={}", past24hSum.add(amount));
            triggerAlert(senderAccount, null, "24H_AGGREGATE_VELOCITY_LIMIT", FraudRiskLevel.HIGH,
                    String.format("Cumulative transfers in 24 hours (₹%s) approached/exceeded safety threshold (₹%s)",
                            past24hSum.add(amount), dailyVelocityLimit));
        }
    }

    public FraudAlertEntity triggerAlert(AccountEntity senderAccount, Long transactionId, String ruleName, FraudRiskLevel riskLevel, String reason) {
        FraudAlertEntity alert = FraudAlertEntity.builder()
                .transactionId(transactionId)
                .user(senderAccount.getUser())
                .ruleTriggered(ruleName)
                .riskLevel(riskLevel)
                .reason(reason)
                .status(FraudAlertStatus.OPEN)
                .build();

        return fraudAlertRepository.save(alert);
    }
}
