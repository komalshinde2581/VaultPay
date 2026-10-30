package com.vaultpay.modules.transfer.dto;

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
public class TransferResponse {
    private String transactionReference;
    private String status;
    private String sourceAccountNumber;
    private String destinationAccountNumber;
    private String recipientName;
    private BigDecimal amount;
    private BigDecimal fee;
    private String currency;
    private BigDecimal remainingBalance;
    private String description;
    private Instant timestamp;
}
