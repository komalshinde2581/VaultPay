package com.vaultpay.modules.beneficiary.dto;

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
public class BeneficiaryResponseDto {
    private Long id;
    private String targetAccountNumber;
    private String beneficiaryName;
    private String nickname;
    private String bankName;
    private String status;
    private boolean coolingActive;
    private Instant coolingEndsAt;
    private BigDecimal transferLimit;
    private Instant createdAt;
}
