package com.vaultpay.modules.account;

import com.vaultpay.common.ErrorCode;
import com.vaultpay.exception.AccountFrozenException;
import com.vaultpay.exception.BusinessException;
import com.vaultpay.exception.ResourceNotFoundException;
import com.vaultpay.modules.account.dto.AccountResponseDto;
import com.vaultpay.modules.account.dto.BalanceDto;
import com.vaultpay.modules.account.dto.CreateAccountRequest;
import com.vaultpay.modules.user.UserEntity;
import com.vaultpay.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public AccountResponseDto createAccount(Long userId, CreateAccountRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        BigDecimal initialDeposit = request.getInitialDeposit() != null && request.getInitialDeposit().compareTo(BigDecimal.ZERO) > 0
                ? request.getInitialDeposit()
                : BigDecimal.ZERO;

        String accountNumber = generateUniqueAccountNumber();

        AccountEntity account = AccountEntity.builder()
                .user(user)
                .accountNumber(accountNumber)
                .accountType(request.getAccountType())
                .currency(request.getCurrency() != null ? request.getCurrency() : "INR")
                .availableBalance(initialDeposit)
                .ledgerBalance(initialDeposit)
                .dailyTransferLimit(new BigDecimal("50000.0000"))
                .status(AccountStatus.ACTIVE)
                .build();

        AccountEntity saved = accountRepository.save(account);
        log.info("Created account {} for user {}", accountNumber, user.getUsername());
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<AccountResponseDto> getUserAccounts(Long userId) {
        return accountRepository.findByUserId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AccountResponseDto getAccountById(Long accountId, Long currentUserId, boolean isAdmin) {
        AccountEntity account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        if (!isAdmin && !account.getUser().getId().equals(currentUserId)) {
            throw new BusinessException("Access denied to requested account", ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }

        return mapToDto(account);
    }

    @Transactional(readOnly = true)
    public BalanceDto getBalance(String accountNumber, Long currentUserId, boolean isAdmin) {
        AccountEntity account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountNumber));

        if (!isAdmin && !account.getUser().getId().equals(currentUserId)) {
            throw new BusinessException("Access denied to requested account", ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }

        return BalanceDto.builder()
                .accountNumber(account.getAccountNumber())
                .currency(account.getCurrency())
                .availableBalance(account.getAvailableBalance())
                .ledgerBalance(account.getLedgerBalance())
                .build();
    }

    @Transactional
    public AccountResponseDto updateAccountStatus(Long accountId, AccountStatus newStatus, String reason) {
        AccountEntity account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        account.setStatus(newStatus);
        AccountEntity updated = accountRepository.save(account);
        log.info("Account {} status updated to {} - Reason: {}", account.getAccountNumber(), newStatus, reason);
        return mapToDto(updated);
    }

    public AccountResponseDto mapToDto(AccountEntity entity) {
        String holder = entity.getUser().getFirstName() + " " + entity.getUser().getLastName();
        return AccountResponseDto.builder()
                .id(entity.getId())
                .userId(entity.getUser().getId())
                .accountHolderName(holder)
                .accountNumber(entity.getAccountNumber())
                .accountType(entity.getAccountType().name())
                .currency(entity.getCurrency())
                .availableBalance(entity.getAvailableBalance())
                .ledgerBalance(entity.getLedgerBalance())
                .dailyTransferLimit(entity.getDailyTransferLimit())
                .status(entity.getStatus().name())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private String generateUniqueAccountNumber() {
        String accNum;
        do {
            accNum = "VP-" + (1000000 + RANDOM.nextInt(9000000));
        } while (accountRepository.existsByAccountNumber(accNum));
        return accNum;
    }
}
