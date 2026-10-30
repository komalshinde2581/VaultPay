package com.vaultpay.modules.beneficiary.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBeneficiaryRequest {

    @NotBlank(message = "Target account number is required")
    private String targetAccountNumber;

    @NotBlank(message = "Beneficiary name is required")
    private String beneficiaryName;

    private String nickname;

    @Builder.Default
    private String bankName = "VaultPay";

    private BigDecimal transferLimit;
}
