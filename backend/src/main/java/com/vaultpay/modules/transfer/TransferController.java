package com.vaultpay.modules.transfer;

import com.vaultpay.common.ApiResponse;
import com.vaultpay.common.PagedResponse;
import com.vaultpay.modules.transfer.dto.TransactionReceiptDto;
import com.vaultpay.modules.transfer.dto.TransferRequest;
import com.vaultpay.modules.transfer.dto.TransferResponse;
import com.vaultpay.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/transfers")
@RequiredArgsConstructor
@Tag(name = "Money Transfers", description = "Simulated fund transfers, idempotency, and transaction receipts")
public class TransferController {

    private final TransferService transferService;

    @PostMapping
    @Operation(summary = "Execute fund transfer with idempotency key")
    public ResponseEntity<ApiResponse<TransferResponse>> transfer(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody TransferRequest request) {

        TransferResponse response = transferService.executeTransfer(currentUser.getId(), request, idempotencyKey);
        return ResponseEntity.ok(ApiResponse.ok("Transfer executed successfully", response));
    }

    @GetMapping
    @Operation(summary = "Query user transaction history with filters and pagination")
    public ResponseEntity<ApiResponse<PagedResponse<TransactionReceiptDto>>> getTransactions(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) TransactionStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {

        Page<TransactionReceiptDto> pageResult = transferService.getUserTransactions(
                currentUser.getId(), status, startDate, endDate, PageRequest.of(page, size));

        PagedResponse<TransactionReceiptDto> pagedResponse = PagedResponse.<TransactionReceiptDto>builder()
                .content(pageResult.getContent())
                .pageNumber(pageResult.getNumber())
                .pageSize(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .last(pageResult.isLast())
                .build();

        return ResponseEntity.ok(ApiResponse.ok(pagedResponse));
    }

    @GetMapping("/reference/{reference}")
    @Operation(summary = "Get transaction receipt details by reference code")
    public ResponseEntity<ApiResponse<TransactionReceiptDto>> getByReference(
            @PathVariable String reference,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        boolean isAdmin = currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        TransactionReceiptDto receipt = transferService.getTransactionByReference(reference, currentUser.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.ok(receipt));
    }
}
