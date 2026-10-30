package com.vaultpay.modules.scheduled.dto;

import com.vaultpay.modules.scheduled.RecurrenceType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateScheduledPaymentRequest {

    @NotBlank(message = "Source account number is required")
    private String sourceAccountNumber;

    @NotBlank(message = "Target account number is required")
    private String targetAccountNumber;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "Recurrence type is required (ONCE, WEEKLY, MONTHLY)")
    private RecurrenceType recurrenceType;

    @NotNull(message = "Execution date is required")
    @FutureOrPresent(message = "Execution date cannot be in the past")
    private LocalDate executionDate;

    private LocalDate endDate;

    private String description;
}
