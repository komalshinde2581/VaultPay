package com.vaultpay.modules.admin;

import com.vaultpay.exception.ResourceNotFoundException;
import com.vaultpay.modules.account.AccountEntity;
import com.vaultpay.modules.account.AccountRepository;
import com.vaultpay.modules.account.AccountService;
import com.vaultpay.modules.account.AccountStatus;
import com.vaultpay.modules.account.dto.AccountResponseDto;
import com.vaultpay.modules.admin.dto.AdminDashboardStatsDto;
import com.vaultpay.modules.admin.dto.AdminUserDto;
import com.vaultpay.modules.admin.dto.ReviewFraudAlertRequest;
import com.vaultpay.modules.audit.AuditLogEntity;
import com.vaultpay.modules.audit.AuditService;
import com.vaultpay.modules.fraud.FraudAlertEntity;
import com.vaultpay.modules.fraud.FraudAlertRepository;
import com.vaultpay.modules.fraud.FraudAlertStatus;
import com.vaultpay.modules.transfer.TransactionEntity;
import com.vaultpay.modules.transfer.TransactionRepository;
import com.vaultpay.modules.transfer.TransferService;
import com.vaultpay.modules.transfer.dto.TransactionReceiptDto;
import com.vaultpay.modules.user.UserEntity;
import com.vaultpay.modules.user.UserRepository;
import com.vaultpay.modules.user.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final FraudAlertRepository fraudAlertRepository;
    private final AuditService auditService;
    private final AccountService accountService;
    private final TransferService transferService;

    @Transactional(readOnly = true)
    public AdminDashboardStatsDto getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalAccounts = accountRepository.count();
        long totalTransactions = transactionRepository.count();
        long openFraudAlerts = fraudAlertRepository.countByStatus(FraudAlertStatus.OPEN);

        List<AccountEntity> allAccounts = accountRepository.findAll();
        BigDecimal totalLiquidity = allAccounts.stream()
                .map(AccountEntity::getAvailableBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Page<AuditLogEntity> audits = auditService.getAuditLogs(Pageable.ofSize(1));
        long totalAuditLogs = audits.getTotalElements();

        return AdminDashboardStatsDto.builder()
                .totalUsers(totalUsers)
                .totalAccounts(totalAccounts)
                .totalTransactions(totalTransactions)
                .systemTotalLiquidity(totalLiquidity)
                .openFraudAlerts(openFraudAlerts)
                .totalAuditLogs(totalAuditLogs)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<AdminUserDto> searchUsers(String query, Pageable pageable) {
        return userRepository.searchUsers(query, pageable).map(this::mapToUserDto);
    }

    @Transactional(readOnly = true)
    public Page<AccountResponseDto> searchAccounts(String query, Pageable pageable) {
        return accountRepository.searchAccounts(query, pageable).map(accountService::mapToDto);
    }

    @Transactional(readOnly = true)
    public Page<TransactionReceiptDto> searchTransactions(String reference, Pageable pageable) {
        return transactionRepository.searchAllTransactions(reference, pageable).map(transferService::mapToReceiptDto);
    }

    @Transactional(readOnly = true)
    public Page<FraudAlertEntity> getFraudAlerts(FraudAlertStatus status, Pageable pageable) {
        if (status != null) {
            return fraudAlertRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        }
        return fraudAlertRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @Transactional
    public FraudAlertEntity reviewFraudAlert(Long alertId, String adminUsername, ReviewFraudAlertRequest request, String ipAddress) {
        FraudAlertEntity alert = fraudAlertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Fraud alert not found: " + alertId));

        alert.setStatus(request.getResolutionStatus());
        alert.setReviewedBy(adminUsername);
        alert.setReviewedAt(Instant.now());
        alert.setResolutionNotes(request.getResolutionNotes());

        FraudAlertEntity saved = fraudAlertRepository.save(alert);
        auditService.logAction(null, adminUsername, "REVIEW_FRAUD_ALERT", "FRAUD_ALERT", String.valueOf(alertId),
                ipAddress, "Resolved with status: " + request.getResolutionStatus() + ". Note: " + request.getResolutionNotes(), "SUCCESS");

        return saved;
    }

    @Transactional
    public AdminUserDto updateUserStatus(Long userId, UserStatus newStatus, String adminUsername, String ipAddress) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        user.setStatus(newStatus);
        if (newStatus == UserStatus.ACTIVE) {
            user.setFailedAttempts(0);
            user.setLockUntil(null);
        }

        UserEntity saved = userRepository.save(user);
        auditService.logAction(null, adminUsername, "UPDATE_USER_STATUS", "USER", String.valueOf(userId),
                ipAddress, "Updated user " + user.getUsername() + " status to " + newStatus, "SUCCESS");

        return mapToUserDto(saved);
    }

    @Transactional
    public AccountResponseDto updateAccountStatus(Long accountId, AccountStatus newStatus, String adminUsername, String ipAddress) {
        AccountEntity account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountId));

        account.setStatus(newStatus);
        AccountEntity saved = accountRepository.save(account);

        auditService.logAction(null, adminUsername, "UPDATE_ACCOUNT_STATUS", "ACCOUNT", account.getAccountNumber(),
                ipAddress, "Updated account status to " + newStatus, "SUCCESS");

        return accountService.mapToDto(saved);
    }

    private AdminUserDto mapToUserDto(UserEntity user) {
        return AdminUserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .failedAttempts(user.getFailedAttempts())
                .lockUntil(user.getLockUntil())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
