package com.vaultpay.modules.scheduled;

import com.vaultpay.common.ErrorCode;
import com.vaultpay.exception.BusinessException;
import com.vaultpay.exception.ResourceNotFoundException;
import com.vaultpay.modules.account.AccountEntity;
import com.vaultpay.modules.account.AccountRepository;
import com.vaultpay.modules.notification.NotificationService;
import com.vaultpay.modules.notification.NotificationType;
import com.vaultpay.modules.scheduled.dto.CreateScheduledPaymentRequest;
import com.vaultpay.modules.scheduled.dto.ScheduledPaymentResponseDto;
import com.vaultpay.modules.transfer.TransferService;
import com.vaultpay.modules.transfer.dto.TransferRequest;
import com.vaultpay.modules.transfer.dto.TransferResponse;
import com.vaultpay.modules.user.UserEntity;
import com.vaultpay.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduledPaymentService {

    private final ScheduledPaymentRepository scheduledPaymentRepository;
    private final ScheduledExecutionRepository executionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final TransferService transferService;
    private final NotificationService notificationService;

    @Transactional
    public ScheduledPaymentResponseDto createScheduledPayment(Long userId, CreateScheduledPaymentRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        AccountEntity sourceAccount = accountRepository.findByAccountNumber(request.getSourceAccountNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Source account not found: " + request.getSourceAccountNumber()));

        if (!sourceAccount.getUser().getId().equals(userId)) {
            throw new BusinessException("You are not authorized to schedule payments from this account",
                    ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }

        if (!accountRepository.existsByAccountNumber(request.getTargetAccountNumber())) {
            throw new BusinessException("Destination account not found: " + request.getTargetAccountNumber(),
                    ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        ScheduledPaymentEntity entity = ScheduledPaymentEntity.builder()
                .user(user)
                .sourceAccount(sourceAccount)
                .targetAccountNumber(request.getTargetAccountNumber())
                .amount(request.getAmount())
                .currency("INR")
                .description(request.getDescription())
                .recurrenceType(request.getRecurrenceType())
                .nextExecutionDate(request.getExecutionDate())
                .endDate(request.getEndDate())
                .status(ScheduledStatus.ACTIVE)
                .build();

        ScheduledPaymentEntity saved = scheduledPaymentRepository.save(entity);
        log.info("Scheduled payment created (ID: {}) for user {}", saved.getId(), user.getUsername());
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ScheduledPaymentResponseDto> getUserScheduledPayments(Long userId) {
        return scheduledPaymentRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelScheduledPayment(Long userId, Long paymentId) {
        ScheduledPaymentEntity payment = scheduledPaymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Scheduled payment not found: " + paymentId));

        if (!payment.getUser().getId().equals(userId)) {
            throw new BusinessException("Access denied to scheduled payment", ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }

        payment.setStatus(ScheduledStatus.CANCELLED);
        scheduledPaymentRepository.save(payment);
        log.info("Cancelled scheduled payment: {}", paymentId);
    }

    @Scheduled(cron = "${vaultpay.scheduled-payments.cron:0 0 1 * * ?}") // Daily at 01:00 AM, can also be triggered manually
    @Transactional
    public void executeDuePayments() {
        LocalDate today = LocalDate.now();
        List<ScheduledPaymentEntity> duePayments = scheduledPaymentRepository
                .findByStatusAndNextExecutionDateLessThanEqual(ScheduledStatus.ACTIVE, today);

        log.info("Evaluating {} due scheduled payments for execution", duePayments.size());

        for (ScheduledPaymentEntity payment : duePayments) {
            String idempotencyKey = String.format("SCHED-EXEC-%d-%s", payment.getId(), payment.getNextExecutionDate());

            TransferRequest transferReq = TransferRequest.builder()
                    .sourceAccountNumber(payment.getSourceAccount().getAccountNumber())
                    .destinationAccountNumber(payment.getTargetAccountNumber())
                    .amount(payment.getAmount())
                    .currency(payment.getCurrency())
                    .description("Scheduled Payment: " + (payment.getDescription() != null ? payment.getDescription() : "Recurring Transfer"))
                    .build();

            try {
                TransferResponse transferRes = transferService.executeTransfer(payment.getUser().getId(), transferReq, idempotencyKey);

                executionRepository.save(ScheduledExecutionEntity.builder()
                        .scheduledPayment(payment)
                        .status("SUCCESS")
                        .build());

                advanceNextExecution(payment, today);
                log.info("Successfully executed scheduled payment {} (Ref: {})", payment.getId(), transferRes.getTransactionReference());
            } catch (Exception ex) {
                log.error("Failed scheduled payment {}: {}", payment.getId(), ex.getMessage());
                executionRepository.save(ScheduledExecutionEntity.builder()
                        .scheduledPayment(payment)
                        .status("FAILED")
                        .errorMessage(ex.getMessage())
                        .build());

                notificationService.createNotification(
                        payment.getUser(),
                        "Scheduled Payment Failed",
                        String.format("Scheduled payment to %s of $%s failed: %s", payment.getTargetAccountNumber(), payment.getAmount(), ex.getMessage()),
                        NotificationType.SCHEDULED_PAYMENT,
                        String.valueOf(payment.getId())
                );
            }
        }
    }

    private void advanceNextExecution(ScheduledPaymentEntity payment, LocalDate currentDate) {
        if (payment.getRecurrenceType() == RecurrenceType.ONCE) {
            payment.setStatus(ScheduledStatus.COMPLETED);
        } else if (payment.getRecurrenceType() == RecurrenceType.WEEKLY) {
            payment.setNextExecutionDate(currentDate.plusWeeks(1));
        } else if (payment.getRecurrenceType() == RecurrenceType.MONTHLY) {
            payment.setNextExecutionDate(currentDate.plusMonths(1));
        }

        if (payment.getEndDate() != null && payment.getNextExecutionDate().isAfter(payment.getEndDate())) {
            payment.setStatus(ScheduledStatus.COMPLETED);
        }

        scheduledPaymentRepository.save(payment);
    }

    private ScheduledPaymentResponseDto mapToDto(ScheduledPaymentEntity entity) {
        return ScheduledPaymentResponseDto.builder()
                .id(entity.getId())
                .sourceAccountNumber(entity.getSourceAccount().getAccountNumber())
                .targetAccountNumber(entity.getTargetAccountNumber())
                .amount(entity.getAmount())
                .currency(entity.getCurrency())
                .description(entity.getDescription())
                .recurrenceType(entity.getRecurrenceType().name())
                .nextExecutionDate(entity.getNextExecutionDate())
                .endDate(entity.getEndDate())
                .status(entity.getStatus().name())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
