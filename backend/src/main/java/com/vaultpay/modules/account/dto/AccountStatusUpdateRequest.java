package com.vaultpay.modules.account.dto;

import com.vaultpay.modules.account.AccountStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountStatusUpdateRequest {
    @NotNull(message = "Account status is required")
    private AccountStatus status;
    private String reason;
}
