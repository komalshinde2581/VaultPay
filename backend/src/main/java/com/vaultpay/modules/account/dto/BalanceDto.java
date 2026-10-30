package com.vaultpay.modules.account.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BalanceDto {
    private String accountNumber;
    private String currency;
    private BigDecimal availableBalance;
    private BigDecimal ledgerBalance;
}
