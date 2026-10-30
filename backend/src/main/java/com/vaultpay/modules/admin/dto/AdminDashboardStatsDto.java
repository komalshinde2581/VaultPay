package com.vaultpay.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsDto {
    private long totalUsers;
    private long totalAccounts;
    private long totalTransactions;
    private BigDecimal systemTotalLiquidity;
    private long openFraudAlerts;
    private long totalAuditLogs;
}
