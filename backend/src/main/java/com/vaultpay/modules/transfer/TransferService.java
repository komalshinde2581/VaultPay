package com.vaultpay.modules.transfer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaultpay.common.ErrorCode;
import com.vaultpay.exception.AccountFrozenException;
import com.vaultpay.exception.BusinessException;
import com.vaultpay.exception.InsufficientBalanceException;
import com.vaultpay.exception.ResourceNotFoundException;
import com.vaultpay.modules.account.AccountEntity;
import com.vaultpay.modules.account.AccountRepository;
import com.vaultpay.modules.beneficiary.BeneficiaryService;
import com.vaultpay.modules.fraud.FraudEngineService;
import com.vaultpay.modules.ledger.LedgerService;
import com.vaultpay.modules.notification.NotificationService;
import com.vaultpay.modules.notification.NotificationType;
import com.vaultpay.modules.outbox.OutboxService;
import com.vaultpay.modules.transfer.dto.TransactionReceiptDto;
import com.vaultpay.modules.transfer.dto.TransferRequest;
import com.vaultpay.modules.transfer.dto.TransferResponse;
import com.vaultpay.modules.user.UserEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransferService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerService ledgerService;
    private final IdempotencyService idempotencyService;
    private final FraudEngineService fraudEngineService;
    private final BeneficiaryService beneficiaryService;
    private final NotificationService notificationService;
    private final OutboxService outboxService;
    private final ObjectMapper objectMapper;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransferResponse executeTransfer(Long currentUserId, TransferRequest request, String idempotencyKey) {
        // 1. Idempotency Check
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<IdempotencyRecordEntity> cachedRecord = idempotencyService.getValidRecord(idempotencyKey);
            if (cachedRecord.isPresent()) {
                log.info("Idempotent request detected for key: {}. Returning cached transaction response.", idempotencyKey);
                try {
                    return objectMapper.readValue(cachedRecord.get().getResponseBody(), TransferResponse.class);
                } catch (Exception e) {
                    log.error("Failed to parse cached response for idempotency key: {}", idempotencyKey);
                }
            }
        }

        // 2. Basic Pre-Validation
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Transfer amount must be strictly greater than zero",
                    ErrorCode.INVALID_AMOUNT, HttpStatus.BAD_REQUEST);
        }

        if (request.getSourceAccountNumber().trim().equalsIgnoreCase(request.getDestinationAccountNumber().trim())) {
            throw new BusinessException("Source and destination accounts cannot be identical",
                    ErrorCode.SELF_TRANSFER_NOT_ALLOWED, HttpStatus.BAD_REQUEST);
        }

        // 3. Resolve Accounts
        AccountEntity senderAccount = accountRepository.findByAccountNumber(request.getSourceAccountNumber().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Source account not found: " + request.getSourceAccountNumber()));

        AccountEntity receiverAccount = accountRepository.findByAccountNumber(request.getDestinationAccountNumber().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Destination account not found: " + request.getDestinationAccountNumber()));

        // Ownership & Status Check
        if (!senderAccount.getUser().getId().equals(currentUserId)) {
            throw new BusinessException("You are not authorized to transfer funds from this account",
                    ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }

        if (!senderAccount.isActive()) {
            throw new AccountFrozenException("Source account is " + senderAccount.getStatus() + " and cannot initiate transfers");
        }

        if (!receiverAccount.isActive()) {
            throw new AccountFrozenException("Destination account is " + receiverAccount.getStatus() + " and cannot receive transfers");
        }

        // 4. Beneficiary & Fraud Rule Evaluation
        beneficiaryService.validateTransferEligibility(currentUserId, receiverAccount.getAccountNumber(), request.getAmount());
        fraudEngineService.evaluateTransfer(senderAccount, request.getAmount());

        // 5. Concurrency Control: Acquire Pessimistic Write Locks in Deterministic Order
        Long id1 = senderAccount.getId().compareTo(receiverAccount.getId()) < 0 ? senderAccount.getId() : receiverAccount.getId();
        Long id2 = senderAccount.getId().compareTo(receiverAccount.getId()) < 0 ? receiverAccount.getId() : senderAccount.getId();

        AccountEntity lockedAccount1 = accountRepository.findByIdForUpdate(id1)
                .orElseThrow(() -> new ResourceNotFoundException("Lock failed for account ID: " + id1));
        AccountEntity lockedAccount2 = accountRepository.findByIdForUpdate(id2)
                .orElseThrow(() -> new ResourceNotFoundException("Lock failed for account ID: " + id2));

        AccountEntity lockedSender = senderAccount.getId().equals(lockedAccount1.getId()) ? lockedAccount1 : lockedAccount2;
        AccountEntity lockedReceiver = receiverAccount.getId().equals(lockedAccount1.getId()) ? lockedAccount1 : lockedAccount2;

        // 6. Sufficient Balance Check
        if (lockedSender.getAvailableBalance().compareTo(request.getAmount()) < 0) {
            throw new InsufficientBalanceException(String.format("Insufficient funds. Available: $%s, Requested: $%s",
                    lockedSender.getAvailableBalance(), request.getAmount()));
        }

        // 7. Atomic Balance Mutation
        BigDecimal senderBalanceAfter = lockedSender.getAvailableBalance().subtract(request.getAmount());
        BigDecimal receiverBalanceAfter = lockedReceiver.getAvailableBalance().add(request.getAmount());

        lockedSender.setAvailableBalance(senderBalanceAfter);
        lockedSender.setLedgerBalance(senderBalanceAfter);

        lockedReceiver.setAvailableBalance(receiverBalanceAfter);
        lockedReceiver.setLedgerBalance(receiverBalanceAfter);

        accountRepository.save(lockedSender);
        accountRepository.save(lockedReceiver);

        // 8. Record Transaction Entity
        String txReference = generateTransactionReference();
        TransactionEntity transaction = TransactionEntity.builder()
                .reference(txReference)
                .idempotencyKey(idempotencyKey)
                .senderAccount(lockedSender)
                .receiverAccount(lockedReceiver)
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : "INR")
                .fee(BigDecimal.ZERO)
                .type(TransactionType.TRANSFER)
                .status(TransactionStatus.SUCCESS)
                .description(request.getDescription() != null ? request.getDescription() : "Money Transfer")
                .completedAt(Instant.now())
                .build();

        TransactionEntity savedTx = transactionRepository.save(transaction);

        // 9. Post Immutable Double-Entry Ledger Entries
        ledgerService.recordDoubleEntry(
                savedTx,
                lockedSender,
                lockedReceiver,
                request.getAmount(),
                senderBalanceAfter,
                receiverBalanceAfter
        );

        // 10. Notifications
        UserEntity senderUser = lockedSender.getUser();
        UserEntity receiverUser = lockedReceiver.getUser();
        String recipientFullName = receiverUser.getFirstName() + " " + receiverUser.getLastName();
        String senderFullName = senderUser.getFirstName() + " " + senderUser.getLastName();

        notificationService.createNotification(
                senderUser,
                "Transfer Successful",
                String.format("You sent $%s to %s (%s). Reference: %s", request.getAmount(), recipientFullName, lockedReceiver.getAccountNumber(), txReference),
                NotificationType.TRANSFER_SENT,
                txReference
        );

        notificationService.createNotification(
                receiverUser,
                "Money Received",
                String.format("You received $%s from %s. Reference: %s", request.getAmount(), senderFullName, txReference),
                NotificationType.TRANSFER_RECEIVED,
                txReference
        );

        // 11. Transactional Outbox for Kafka streaming
        outboxService.recordEvent(
                "TRANSACTION",
                txReference,
                "TransactionCompletedEvent",
                Map.of(
                        "reference", txReference,
                        "amount", request.getAmount(),
                        "senderAccount", lockedSender.getAccountNumber(),
                        "receiverAccount", lockedReceiver.getAccountNumber(),
                        "status", "SUCCESS",
                        "timestamp", Instant.now().toString()
                )
        );

        // 12. Build Final Transfer Response
        TransferResponse response = TransferResponse.builder()
                .transactionReference(txReference)
                .status("SUCCESS")
                .sourceAccountNumber(lockedSender.getAccountNumber())
                .destinationAccountNumber(lockedReceiver.getAccountNumber())
                .recipientName(recipientFullName)
                .amount(request.getAmount())
                .fee(BigDecimal.ZERO)
                .currency(transaction.getCurrency())
                .remainingBalance(senderBalanceAfter)
                .description(transaction.getDescription())
                .timestamp(transaction.getCompletedAt())
                .build();

        // 13. Cache in Idempotency Store
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            idempotencyService.record(idempotencyKey, currentUserId, request, 200, response);
        }

        return response;
    }

    @Transactional(readOnly = true)
    public Page<TransactionReceiptDto> getUserTransactions(Long userId, TransactionStatus status, Instant startDate, Instant endDate, Pageable pageable) {
        return transactionRepository.findUserTransactions(userId, status, startDate, endDate, pageable)
                .map(this::mapToReceiptDto);
    }

    @Transactional(readOnly = true)
    public TransactionReceiptDto getTransactionByReference(String reference, Long currentUserId, boolean isAdmin) {
        TransactionEntity tx = transactionRepository.findByReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + reference));

        boolean isParticipant = tx.getSenderAccount().getUser().getId().equals(currentUserId) ||
                               tx.getReceiverAccount().getUser().getId().equals(currentUserId);

        if (!isAdmin && !isParticipant) {
            throw new BusinessException("Access denied to transaction details", ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }

        return mapToReceiptDto(tx);
    }

    public TransactionReceiptDto mapToReceiptDto(TransactionEntity entity) {
        String senderName = entity.getSenderAccount().getUser().getFirstName() + " " + entity.getSenderAccount().getUser().getLastName();
        String receiverName = entity.getReceiverAccount().getUser().getFirstName() + " " + entity.getReceiverAccount().getUser().getLastName();

        return TransactionReceiptDto.builder()
                .id(entity.getId())
                .reference(entity.getReference())
                .idempotencyKey(entity.getIdempotencyKey())
                .senderAccountNumber(entity.getSenderAccount().getAccountNumber())
                .senderName(senderName)
                .receiverAccountNumber(entity.getReceiverAccount().getAccountNumber())
                .receiverName(receiverName)
                .amount(entity.getAmount())
                .fee(entity.getFee())
                .currency(entity.getCurrency())
                .type(entity.getType().name())
                .status(entity.getStatus().name())
                .description(entity.getDescription())
                .failureReason(entity.getFailureReason())
                .createdAt(entity.getCreatedAt())
                .completedAt(entity.getCompletedAt())
                .build();
    }

    private String generateTransactionReference() {
        return "TX-" + Instant.now().toEpochMilli() + "-" + (1000 + RANDOM.nextInt(9000));
    }
}
