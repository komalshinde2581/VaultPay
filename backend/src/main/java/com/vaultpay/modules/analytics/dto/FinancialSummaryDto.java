package com.vaultpay.modules.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialSummaryDto {
    private BigDecimal totalBalance;
    private BigDecimal totalIncoming;
    private BigDecimal totalOutgoing;
    private BigDecimal netCashFlow;
    private long totalTransactions;
    private double successRate;
}
