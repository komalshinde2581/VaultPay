package com.vaultpay.modules.analytics;

import com.vaultpay.modules.account.AccountEntity;
import com.vaultpay.modules.account.AccountRepository;
import com.vaultpay.modules.analytics.dto.CategorySpendingDto;
import com.vaultpay.modules.analytics.dto.DailySpendingDto;
import com.vaultpay.modules.analytics.dto.FinancialSummaryDto;
import com.vaultpay.modules.analytics.dto.MonthlyTrendDto;
import com.vaultpay.modules.transfer.TransactionEntity;
import com.vaultpay.modules.transfer.TransactionRepository;
import com.vaultpay.modules.transfer.TransactionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public FinancialSummaryDto getSummary(Long userId) {
        List<AccountEntity> accounts = accountRepository.findByUserId(userId);
        BigDecimal totalBalance = accounts.stream()
                .filter(AccountEntity::isActive)
                .map(AccountEntity::getAvailableBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalIncoming = transactionRepository.calculateTotalIncoming(userId, null);
        BigDecimal totalOutgoing = transactionRepository.calculateTotalOutgoing(userId, null);
        BigDecimal netCashFlow = totalIncoming.subtract(totalOutgoing);

        Page<TransactionEntity> recentTx = transactionRepository.findUserTransactions(
                userId, null, null, null, PageRequest.of(0, 500));
        long totalCount = recentTx.getTotalElements();
        long successCount = recentTx.getContent().stream()
                .filter(t -> t.getStatus() == TransactionStatus.SUCCESS)
                .count();

        double successRate = totalCount > 0 ? ((double) successCount / totalCount) * 100.0 : 100.0;

        return FinancialSummaryDto.builder()
                .totalBalance(totalBalance)
                .totalIncoming(totalIncoming)
                .totalOutgoing(totalOutgoing)
                .netCashFlow(netCashFlow)
                .totalTransactions(totalCount)
                .successRate(Math.round(successRate * 10.0) / 10.0)
                .build();
    }

    @Transactional(readOnly = true)
    public List<MonthlyTrendDto> getMonthlyTrends(Long userId) {
        Page<TransactionEntity> txPage = transactionRepository.findUserTransactions(
                userId, TransactionStatus.SUCCESS, null, null, PageRequest.of(0, 500));

        Map<String, BigDecimal> incomingMap = new LinkedHashMap<>();
        Map<String, BigDecimal> outgoingMap = new LinkedHashMap<>();

        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy");
        LocalDate now = LocalDate.now();

        // Initialize last 6 months in order
        for (int i = 5; i >= 0; i--) {
            String mKey = now.minusMonths(i).format(monthFormatter);
            incomingMap.put(mKey, BigDecimal.ZERO);
            outgoingMap.put(mKey, BigDecimal.ZERO);
        }

        for (TransactionEntity tx : txPage.getContent()) {
            if (tx.getCreatedAt() == null) continue;
            LocalDate txDate = tx.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
            String mKey = txDate.format(monthFormatter);

            if (incomingMap.containsKey(mKey)) {
                if (tx.getReceiverAccount().getUser().getId().equals(userId)) {
                    incomingMap.put(mKey, incomingMap.get(mKey).add(tx.getAmount()));
                }
                if (tx.getSenderAccount().getUser().getId().equals(userId)) {
                    outgoingMap.put(mKey, outgoingMap.get(mKey).add(tx.getAmount()));
                }
            }
        }

        List<MonthlyTrendDto> trends = new ArrayList<>();
        for (String mKey : incomingMap.keySet()) {
            BigDecimal inc = incomingMap.get(mKey);
            BigDecimal out = outgoingMap.get(mKey);
            trends.add(MonthlyTrendDto.builder()
                    .month(mKey)
                    .incoming(inc)
                    .outgoing(out)
                    .net(inc.subtract(out))
                    .build());
        }
        return trends;
    }

    @Transactional(readOnly = true)
    public List<CategorySpendingDto> getSpendingCategories(Long userId) {
        Page<TransactionEntity> txPage = transactionRepository.findUserTransactions(
                userId, TransactionStatus.SUCCESS, null, null, PageRequest.of(0, 500));

        Map<String, BigDecimal> categorySums = new HashMap<>();
        categorySums.put("Transfers & P2P", BigDecimal.ZERO);
        categorySums.put("Bills & Utilities", BigDecimal.ZERO);
        categorySums.put("Savings Deposit", BigDecimal.ZERO);
        categorySums.put("General Expenses", BigDecimal.ZERO);

        BigDecimal totalOutgoing = BigDecimal.ZERO;

        for (TransactionEntity tx : txPage.getContent()) {
            if (tx.getSenderAccount().getUser().getId().equals(userId)) {
                BigDecimal amt = tx.getAmount();
                totalOutgoing = totalOutgoing.add(amt);

                String desc = tx.getDescription() != null ? tx.getDescription().toLowerCase() : "";
                if (desc.contains("bill") || desc.contains("rent") || desc.contains("utility")) {
                    categorySums.put("Bills & Utilities", categorySums.get("Bills & Utilities").add(amt));
                } else if (desc.contains("saving") || tx.getReceiverAccount().getAccountType().name().equals("SAVINGS")) {
                    categorySums.put("Savings Deposit", categorySums.get("Savings Deposit").add(amt));
                } else if (desc.contains("transfer") || desc.contains("split") || desc.contains("reimburse")) {
                    categorySums.put("Transfers & P2P", categorySums.get("Transfers & P2P").add(amt));
                } else {
                    categorySums.put("General Expenses", categorySums.get("General Expenses").add(amt));
                }
            }
        }

        if (totalOutgoing.compareTo(BigDecimal.ZERO) == 0) {
            return Collections.emptyList();
        }

        List<CategorySpendingDto> result = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : categorySums.entrySet()) {
            if (entry.getValue().compareTo(BigDecimal.ZERO) > 0) {
                double pct = entry.getValue()
                        .multiply(new BigDecimal(100))
                        .divide(totalOutgoing, 2, RoundingMode.HALF_UP)
                        .doubleValue();

                result.add(CategorySpendingDto.builder()
                        .category(entry.getKey())
                        .amount(entry.getValue())
                        .percentage(pct)
                        .build());
            }
        }
        result.sort((a, b) -> b.getAmount().compareTo(a.getAmount()));
        return result;
    }

    @Transactional(readOnly = true)
    public List<DailySpendingDto> getDailySpending(Long userId, int days) {
        Page<TransactionEntity> txPage = transactionRepository.findUserTransactions(
                userId, TransactionStatus.SUCCESS, null, null, PageRequest.of(0, 500));

        Map<LocalDate, BigDecimal> dailyMap = new TreeMap<>();
        LocalDate today = LocalDate.now();
        for (int i = days - 1; i >= 0; i--) {
            dailyMap.put(today.minusDays(i), BigDecimal.ZERO);
        }

        for (TransactionEntity tx : txPage.getContent()) {
            if (tx.getSenderAccount().getUser().getId().equals(userId) && tx.getCreatedAt() != null) {
                LocalDate d = tx.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
                if (dailyMap.containsKey(d)) {
                    dailyMap.put(d, dailyMap.get(d).add(tx.getAmount()));
                }
            }
        }

        return dailyMap.entrySet().stream()
                .map(e -> DailySpendingDto.builder().date(e.getKey()).amount(e.getValue()).build())
                .collect(Collectors.toList());
    }
}
