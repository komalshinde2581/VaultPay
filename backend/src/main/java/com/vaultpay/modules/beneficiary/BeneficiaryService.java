package com.vaultpay.modules.beneficiary;

import com.vaultpay.common.ErrorCode;
import com.vaultpay.exception.BusinessException;
import com.vaultpay.exception.ResourceNotFoundException;
import com.vaultpay.modules.account.AccountEntity;
import com.vaultpay.modules.account.AccountRepository;
import com.vaultpay.modules.beneficiary.dto.BeneficiaryResponseDto;
import com.vaultpay.modules.beneficiary.dto.CreateBeneficiaryRequest;
import com.vaultpay.modules.user.UserEntity;
import com.vaultpay.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BeneficiaryService {

    private final BeneficiaryRepository beneficiaryRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Value("${vaultpay.beneficiary.cooling-period-hours:2}")
    private int coolingPeriodHours;

    @Value("${vaultpay.beneficiary.initial-transfer-limit:1000.00}")
    private BigDecimal initialTransferLimit;

    @Transactional
    public BeneficiaryResponseDto addBeneficiary(Long userId, CreateBeneficiaryRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // 1. Verify destination account exists
        AccountEntity targetAccount = accountRepository.findByAccountNumber(request.getTargetAccountNumber())
                .orElseThrow(() -> new BusinessException("Destination account not found with account number: " + request.getTargetAccountNumber(),
                        ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND));

        // 2. Prevent self as beneficiary
        if (targetAccount.getUser().getId().equals(userId)) {
            throw new BusinessException("You cannot add your own account as a beneficiary",
                    ErrorCode.SELF_TRANSFER_NOT_ALLOWED, HttpStatus.BAD_REQUEST);
        }

        // 3. Prevent duplicate active beneficiary
        if (beneficiaryRepository.existsByUserIdAndTargetAccountNumberAndStatusNot(userId, request.getTargetAccountNumber(), BeneficiaryStatus.DELETED)) {
            throw new BusinessException("Beneficiary is already registered for this account number",
                    ErrorCode.VALIDATION_ERROR, HttpStatus.CONFLICT);
        }

        Instant coolingEndsAt = Instant.now().plus(coolingPeriodHours, ChronoUnit.HOURS);
        BigDecimal limit = request.getTransferLimit() != null ? request.getTransferLimit() : initialTransferLimit;

        BeneficiaryEntity entity = BeneficiaryEntity.builder()
                .user(user)
                .targetAccountNumber(request.getTargetAccountNumber())
                .beneficiaryName(request.getBeneficiaryName())
                .nickname(request.getNickname())
                .bankName(request.getBankName() != null ? request.getBankName() : "VaultPay")
                .coolingEndsAt(coolingEndsAt)
                .status(BeneficiaryStatus.ACTIVE)
                .transferLimit(limit)
                .build();

        BeneficiaryEntity saved = beneficiaryRepository.save(entity);
        log.info("Registered beneficiary {} for user {}. Cooling active until {}", request.getTargetAccountNumber(), user.getUsername(), coolingEndsAt);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<BeneficiaryResponseDto> getUserBeneficiaries(Long userId) {
        return beneficiaryRepository.findByUserIdAndStatusNot(userId, BeneficiaryStatus.DELETED).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteBeneficiary(Long userId, Long beneficiaryId) {
        BeneficiaryEntity entity = beneficiaryRepository.findById(beneficiaryId)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found: " + beneficiaryId));

        if (!entity.getUser().getId().equals(userId)) {
            throw new BusinessException("Access denied to requested beneficiary", ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }

        entity.setStatus(BeneficiaryStatus.DELETED);
        beneficiaryRepository.save(entity);
        log.info("Deleted beneficiary {} for user {}", beneficiaryId, userId);
    }

    @Transactional(readOnly = true)
    public void validateTransferEligibility(Long userId, String targetAccountNumber, BigDecimal amount) {
        beneficiaryRepository.findByUserIdAndTargetAccountNumberAndStatusNot(userId, targetAccountNumber, BeneficiaryStatus.DELETED)
                .ifPresent(beneficiary -> {
                    if (beneficiary.isCoolingActive() && amount.compareTo(beneficiary.getTransferLimit()) > 0) {
                        throw new BusinessException(
                                String.format("Cooling period is active for new beneficiary. Maximum transfer limit is $%s until %s",
                                        beneficiary.getTransferLimit(), beneficiary.getCoolingEndsAt()),
                                ErrorCode.COOLING_PERIOD_ACTIVE, HttpStatus.BAD_REQUEST
                        );
                    }
                });
    }

    private BeneficiaryResponseDto mapToDto(BeneficiaryEntity entity) {
        return BeneficiaryResponseDto.builder()
                .id(entity.getId())
                .targetAccountNumber(entity.getTargetAccountNumber())
                .beneficiaryName(entity.getBeneficiaryName())
                .nickname(entity.getNickname())
                .bankName(entity.getBankName())
                .status(entity.getStatus().name())
                .coolingActive(entity.isCoolingActive())
                .coolingEndsAt(entity.getCoolingEndsAt())
                .transferLimit(entity.getTransferLimit())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
