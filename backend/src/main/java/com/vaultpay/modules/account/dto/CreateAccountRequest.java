package com.vaultpay.modules.account.dto;

import com.vaultpay.modules.account.AccountType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAccountRequest {
    @NotNull(message = "Account type is required")
    private AccountType accountType;

    @Builder.Default
    private String currency = "INR";

    private BigDecimal initialDeposit;
}
