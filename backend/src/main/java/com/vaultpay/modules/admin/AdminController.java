package com.vaultpay.modules.admin;

import com.vaultpay.common.ApiResponse;
import com.vaultpay.common.PagedResponse;
import com.vaultpay.modules.account.AccountStatus;
import com.vaultpay.modules.account.dto.AccountResponseDto;
import com.vaultpay.modules.admin.dto.AdminDashboardStatsDto;
import com.vaultpay.modules.admin.dto.AdminUserDto;
import com.vaultpay.modules.admin.dto.ReviewFraudAlertRequest;
import com.vaultpay.modules.audit.AuditLogEntity;
import com.vaultpay.modules.audit.AuditService;
import com.vaultpay.modules.fraud.FraudAlertEntity;
import com.vaultpay.modules.fraud.FraudAlertStatus;
import com.vaultpay.modules.transfer.dto.TransactionReceiptDto;
import com.vaultpay.modules.user.UserStatus;
import com.vaultpay.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Administration", description = "Backoffice banking operations, user control, fraud review, and audit trails")
public class AdminController {

    private final AdminService adminService;
    private final AuditService auditService;

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Get platform-wide system and financial statistics")
    public ResponseEntity<ApiResponse<AdminDashboardStatsDto>> getStats() {
        AdminDashboardStatsDto stats = adminService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @GetMapping("/users")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPPORT')")
    @Operation(summary = "Search registered users with pagination")
    public ResponseEntity<ApiResponse<PagedResponse<AdminUserDto>>> getUsers(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Page<AdminUserDto> pageResult = adminService.searchUsers(query, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(mapPaged(pageResult)));
    }

    @PatchMapping("/users/{id}/status")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Update user status (ACTIVE, LOCKED, SUSPENDED)")
    public ResponseEntity<ApiResponse<AdminUserDto>> updateUserStatus(
            @PathVariable Long id,
            @RequestParam UserStatus status,
            @AuthenticationPrincipal UserPrincipal admin,
            HttpServletRequest request) {
        AdminUserDto updated = adminService.updateUserStatus(id, status, admin.getUsername(), request.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok("User status updated", updated));
    }

    @GetMapping("/accounts")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPPORT')")
    @Operation(summary = "Search virtual accounts")
    public ResponseEntity<ApiResponse<PagedResponse<AccountResponseDto>>> getAccounts(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Page<AccountResponseDto> pageResult = adminService.searchAccounts(query, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(mapPaged(pageResult)));
    }

    @PatchMapping("/accounts/{id}/status")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Freeze or activate an account as admin")
    public ResponseEntity<ApiResponse<AccountResponseDto>> updateAccountStatus(
            @PathVariable Long id,
            @RequestParam AccountStatus status,
            @AuthenticationPrincipal UserPrincipal admin,
            HttpServletRequest request) {
        AccountResponseDto updated = adminService.updateAccountStatus(id, status, admin.getUsername(), request.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok("Account status updated", updated));
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPPORT')")
    @Operation(summary = "Search transactions across all accounts")
    public ResponseEntity<ApiResponse<PagedResponse<TransactionReceiptDto>>> getTransactions(
            @RequestParam(required = false) String reference,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Page<TransactionReceiptDto> pageResult = adminService.searchTransactions(reference, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(mapPaged(pageResult)));
    }

    @GetMapping("/fraud-alerts")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPPORT')")
    @Operation(summary = "List rule-based fraud alerts")
    public ResponseEntity<ApiResponse<PagedResponse<FraudAlertEntity>>> getFraudAlerts(
            @RequestParam(required = false) FraudAlertStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Page<FraudAlertEntity> pageResult = adminService.getFraudAlerts(status, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(mapPaged(pageResult)));
    }

    @PatchMapping("/fraud-alerts/{id}/review")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Review and resolve a fraud alert")
    public ResponseEntity<ApiResponse<FraudAlertEntity>> reviewFraudAlert(
            @PathVariable Long id,
            @Valid @RequestBody ReviewFraudAlertRequest request,
            @AuthenticationPrincipal UserPrincipal admin,
            HttpServletRequest httpRequest) {
        FraudAlertEntity resolved = adminService.reviewFraudAlert(id, admin.getUsername(), request, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok("Fraud alert resolved", resolved));
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "View security audit trails")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLogEntity>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<AuditLogEntity> pageResult = auditService.getAuditLogs(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(mapPaged(pageResult)));
    }

    private <T> PagedResponse<T> mapPaged(Page<T> page) {
        return PagedResponse.<T>builder()
                .content(page.getContent())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
