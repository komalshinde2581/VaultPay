package com.vaultpay.modules.account;

import com.vaultpay.common.ApiResponse;
import com.vaultpay.modules.account.dto.AccountResponseDto;
import com.vaultpay.modules.account.dto.BalanceDto;
import com.vaultpay.modules.account.dto.CreateAccountRequest;
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
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@Tag(name = "Bank Accounts", description = "Virtual bank account management and balance verification")
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    @Operation(summary = "List current user's bank accounts")
    public ResponseEntity<ApiResponse<List<AccountResponseDto>>> getMyAccounts(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<AccountResponseDto> accounts = accountService.getUserAccounts(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(accounts));
    }

    @PostMapping
    @Operation(summary = "Open a new virtual account")
    public ResponseEntity<ApiResponse<AccountResponseDto>> createAccount(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CreateAccountRequest request) {
        AccountResponseDto account = accountService.createAccount(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Account created successfully", account));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get account details by ID")
    public ResponseEntity<ApiResponse<AccountResponseDto>> getAccountById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean isAdmin = currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        AccountResponseDto account = accountService.getAccountById(id, currentUser.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.ok(account));
    }

    @GetMapping("/{accountNumber}/balance")
    @Operation(summary = "Check balance of account number")
    public ResponseEntity<ApiResponse<BalanceDto>> getAccountBalance(
            @PathVariable String accountNumber,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean isAdmin = currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        BalanceDto balance = accountService.getBalance(accountNumber, currentUser.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.ok(balance));
    }

    @PatchMapping("/{id}/freeze")
    @Operation(summary = "Freeze account")
    public ResponseEntity<ApiResponse<AccountResponseDto>> freezeAccount(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "User requested freeze") String reason) {
        AccountResponseDto account = accountService.updateAccountStatus(id, AccountStatus.FROZEN, reason);
        return ResponseEntity.ok(ApiResponse.ok("Account frozen successfully", account));
    }

    @PatchMapping("/{id}/unfreeze")
    @Operation(summary = "Unfreeze account")
    public ResponseEntity<ApiResponse<AccountResponseDto>> unfreezeAccount(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "User requested unfreeze") String reason) {
        AccountResponseDto account = accountService.updateAccountStatus(id, AccountStatus.ACTIVE, reason);
        return ResponseEntity.ok(ApiResponse.ok("Account reactivated successfully", account));
    }
}
