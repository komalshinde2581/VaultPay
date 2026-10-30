package com.vaultpay.modules.account.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountResponseDto {
    private Long id;
    private Long userId;
    private String accountHolderName;
    private String accountNumber;
    private String accountType;
    private String currency;
    private BigDecimal availableBalance;
    private BigDecimal ledgerBalance;
    private BigDecimal dailyTransferLimit;
    private String status;
    private Instant createdAt;
}
