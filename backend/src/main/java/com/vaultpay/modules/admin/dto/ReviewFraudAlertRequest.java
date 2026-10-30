package com.vaultpay.modules.admin.dto;

import com.vaultpay.modules.fraud.FraudAlertStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewFraudAlertRequest {

    @NotNull(message = "Resolution status is required")
    private FraudAlertStatus resolutionStatus;

    private String resolutionNotes;
}
