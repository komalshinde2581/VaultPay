package com.vaultpay.config;

import com.vaultpay.modules.account.AccountEntity;
import com.vaultpay.modules.account.AccountRepository;
import com.vaultpay.modules.account.AccountStatus;
import com.vaultpay.modules.account.AccountType;
import com.vaultpay.modules.beneficiary.BeneficiaryEntity;
import com.vaultpay.modules.beneficiary.BeneficiaryRepository;
import com.vaultpay.modules.beneficiary.BeneficiaryStatus;
import com.vaultpay.modules.ledger.EntryType;
import com.vaultpay.modules.ledger.LedgerEntryEntity;
import com.vaultpay.modules.ledger.LedgerRepository;
import com.vaultpay.modules.notification.NotificationEntity;
import com.vaultpay.modules.notification.NotificationRepository;
import com.vaultpay.modules.notification.NotificationType;
import com.vaultpay.modules.transfer.TransactionEntity;
import com.vaultpay.modules.transfer.TransactionRepository;
import com.vaultpay.modules.transfer.TransactionStatus;
import com.vaultpay.modules.transfer.TransactionType;
import com.vaultpay.modules.user.Role;
import com.vaultpay.modules.user.UserEntity;
import com.vaultpay.modules.user.UserRepository;
import com.vaultpay.modules.user.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerRepository ledgerRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking VaultPay system initialization and demo data...");

        String defaultEncodedPassword = passwordEncoder.encode("Password123!");

        // 1. Create or update core users
        UserEntity reserve = initUser("system_reserve", "reserve@vaultpay.internal", "System", "Reserve", Role.ROLE_ADMIN, defaultEncodedPassword);
        UserEntity admin = initUser("admin", "admin@vaultpay.internal", "Chief", "Administrator", Role.ROLE_ADMIN, defaultEncodedPassword);
        UserEntity support = initUser("support", "support@vaultpay.internal", "Support", "Agent", Role.ROLE_SUPPORT, defaultEncodedPassword);
        UserEntity alex = initUser("alex", "alex@vaultpay.internal", "Alex", "Mercer", Role.ROLE_CUSTOMER, defaultEncodedPassword);
        UserEntity sarah = initUser("sarah", "sarah@vaultpay.internal", "Sarah", "Connor", Role.ROLE_CUSTOMER, defaultEncodedPassword);

        // 2. Initialize Accounts if absent
        AccountEntity reserveAccount = initAccount(reserve, "VP-0000001", AccountType.BUSINESS, new BigDecimal("10000000.0000"));
        AccountEntity alexChecking = initAccount(alex, "VP-1000101", AccountType.CHECKING, new BigDecimal("15450.0000"));
        AccountEntity alexSavings = initAccount(alex, "VP-1000102", AccountType.SAVINGS, new BigDecimal("32000.0000"));
        AccountEntity sarahChecking = initAccount(sarah, "VP-2000201", AccountType.CHECKING, new BigDecimal("8750.0000"));

        // 3. Initialize Seed Transactions & Balanced Ledger if absent
        if (transactionRepository.count() == 0) {
            log.info("Seeding initial double-entry ledger transactions...");

            // Tx 1: Funding Alex Checking
            createSeededTransfer(reserveAccount, alexChecking, new BigDecimal("15450.0000"), "TX-INIT-001",
                    "Initial Account Opening Funding", Instant.now().minus(10, ChronoUnit.DAYS));

            // Tx 2: Funding Alex Savings
            createSeededTransfer(reserveAccount, alexSavings, new BigDecimal("32000.0000"), "TX-INIT-002",
                    "Initial Savings Funding", Instant.now().minus(9, ChronoUnit.DAYS));

            // Tx 3: Funding Sarah Checking
            createSeededTransfer(reserveAccount, sarahChecking, new BigDecimal("9000.0000"), "TX-INIT-003",
                    "Initial Account Opening Funding", Instant.now().minus(8, ChronoUnit.DAYS));

            // Tx 4: Sarah sent ₹250 to Alex
            createSeededTransfer(sarahChecking, alexChecking, new BigDecimal("250.0000"), "TX-DEMO-004",
                    "Dinner split reimbursement", Instant.now().minus(2, ChronoUnit.DAYS));
        }

        // 4. Beneficiaries
        if (beneficiaryRepository.count() == 0) {
            beneficiaryRepository.save(BeneficiaryEntity.builder()
                    .user(alex)
                    .targetAccountNumber("VP-2000201")
                    .beneficiaryName("Sarah Connor")
                    .nickname("Sarah C.")
                    .bankName("VaultPay")
                    .coolingEndsAt(Instant.now().minus(1, ChronoUnit.DAYS))
                    .status(BeneficiaryStatus.ACTIVE)
                    .transferLimit(new BigDecimal("50000.0000"))
                    .build());

            beneficiaryRepository.save(BeneficiaryEntity.builder()
                    .user(sarah)
                    .targetAccountNumber("VP-1000101")
                    .beneficiaryName("Alex Mercer")
                    .nickname("Alex Checking")
                    .bankName("VaultPay")
                    .coolingEndsAt(Instant.now().minus(1, ChronoUnit.DAYS))
                    .status(BeneficiaryStatus.ACTIVE)
                    .transferLimit(new BigDecimal("50000.0000"))
                    .build());
        }

        // 5. Notifications
        if (notificationRepository.count() == 0) {
            notificationRepository.save(NotificationEntity.builder()
                    .user(alex)
                    .title("Payment Received")
                    .message("You received ₹250.00 from Sarah Connor for Dinner split reimbursement.")
                    .type(NotificationType.TRANSFER_RECEIVED)
                    .read(false)
                    .referenceId("TX-DEMO-004")
                    .build());

            notificationRepository.save(NotificationEntity.builder()
                    .user(alex)
                    .title("Account Activated")
                    .message("Welcome to VaultPay! Your checking account VP-1000101 is now active.")
                    .type(NotificationType.SECURITY_ALERT)
                    .read(true)
                    .referenceId("VP-1000101")
                    .build());
        }

        log.info("VaultPay initialization completed successfully. Demo credentials ready (Password123!).");
    }

    private UserEntity initUser(String username, String email, String first, String last, Role role, String encodedPassword) {
        return userRepository.findByUsername(username).orElseGet(() -> {
            UserEntity user = UserEntity.builder()
                    .username(username)
                    .email(email)
                    .firstName(first)
                    .lastName(last)
                    .passwordHash(encodedPassword)
                    .role(role)
                    .status(UserStatus.ACTIVE)
                    .failedAttempts(0)
                    .build();
            return userRepository.save(user);
        });
    }

    private AccountEntity initAccount(UserEntity user, String accNum, AccountType type, BigDecimal balance) {
        return accountRepository.findByAccountNumber(accNum).orElseGet(() -> {
            AccountEntity account = AccountEntity.builder()
                    .user(user)
                    .accountNumber(accNum)
                    .accountType(type)
                    .currency("INR")
                    .availableBalance(balance)
                    .ledgerBalance(balance)
                    .dailyTransferLimit(new BigDecimal("100000.0000"))
                    .status(AccountStatus.ACTIVE)
                    .build();
            return accountRepository.save(account);
        });
    }

    private void createSeededTransfer(AccountEntity sender, AccountEntity receiver, BigDecimal amount, String ref, String desc, Instant timestamp) {
        TransactionEntity tx = TransactionEntity.builder()
                .reference(ref)
                .idempotencyKey("IDEMP-" + ref)
                .senderAccount(sender)
                .receiverAccount(receiver)
                .amount(amount)
                .currency("INR")
                .fee(BigDecimal.ZERO)
                .type(TransactionType.TRANSFER)
                .status(TransactionStatus.SUCCESS)
                .description(desc)
                .createdAt(timestamp)
                .completedAt(timestamp)
                .build();
        TransactionEntity savedTx = transactionRepository.save(tx);

        LedgerEntryEntity debit = LedgerEntryEntity.builder()
                .transaction(savedTx)
                .account(sender)
                .entryType(EntryType.DEBIT)
                .amount(amount)
                .balanceAfter(sender.getAvailableBalance())
                .createdAt(timestamp)
                .build();

        LedgerEntryEntity credit = LedgerEntryEntity.builder()
                .transaction(savedTx)
                .account(receiver)
                .entryType(EntryType.CREDIT)
                .amount(amount)
                .balanceAfter(receiver.getAvailableBalance())
                .createdAt(timestamp)
                .build();

        ledgerRepository.save(debit);
        ledgerRepository.save(credit);
    }
}
