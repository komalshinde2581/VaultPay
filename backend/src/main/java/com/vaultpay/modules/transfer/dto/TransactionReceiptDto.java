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
public class TransactionReceiptDto {
    private Long id;
    private String reference;
    private String idempotencyKey;
    private String senderAccountNumber;
    private String senderName;
    private String receiverAccountNumber;
    private String receiverName;
    private BigDecimal amount;
    private BigDecimal fee;
    private String currency;
    private String type;
    private String status;
    private String description;
    private String failureReason;
    private Instant createdAt;
    private Instant completedAt;
}
