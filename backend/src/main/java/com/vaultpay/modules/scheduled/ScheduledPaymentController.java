package com.vaultpay.modules.scheduled;

import com.vaultpay.common.ApiResponse;
import com.vaultpay.modules.scheduled.dto.CreateScheduledPaymentRequest;
import com.vaultpay.modules.scheduled.dto.ScheduledPaymentResponseDto;
import com.vaultpay.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/scheduled-payments")
@RequiredArgsConstructor
@Tag(name = "Scheduled Payments", description = "Future-dated and recurring transfer scheduling")
public class ScheduledPaymentController {

    private final ScheduledPaymentService scheduledPaymentService;

    @GetMapping
    @Operation(summary = "List current user's scheduled transfers")
    public ResponseEntity<ApiResponse<List<ScheduledPaymentResponseDto>>> getMyScheduledPayments(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<ScheduledPaymentResponseDto> payments = scheduledPaymentService.getUserScheduledPayments(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(payments));
    }

    @PostMapping
    @Operation(summary = "Schedule a new payment or recurring transfer")
    public ResponseEntity<ApiResponse<ScheduledPaymentResponseDto>> createScheduledPayment(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CreateScheduledPaymentRequest request) {
        ScheduledPaymentResponseDto response = scheduledPaymentService.createScheduledPayment(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Payment scheduled successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Cancel an active scheduled payment")
    public ResponseEntity<ApiResponse<Void>> cancelScheduledPayment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        scheduledPaymentService.cancelScheduledPayment(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Scheduled payment cancelled", null));
    }

    @PostMapping("/trigger-run")
    @Operation(summary = "Manually trigger due payment execution for testing")
    public ResponseEntity<ApiResponse<String>> triggerDuePayments() {
        scheduledPaymentService.executeDuePayments();
        return ResponseEntity.ok(ApiResponse.ok("Execution cycle completed", "OK"));
    }
}
