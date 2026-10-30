package com.vaultpay.modules.beneficiary;

import com.vaultpay.modules.user.UserEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "beneficiaries")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BeneficiaryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "target_account_number", nullable = false, length = 20)
    private String targetAccountNumber;

    @Column(name = "beneficiary_name", nullable = false, length = 100)
    private String beneficiaryName;

    @Column(length = 50)
    private String nickname;

    @Column(name = "bank_name", length = 50)
    @Builder.Default
    private String bankName = "VaultPay";

    @Column(name = "cooling_ends_at")
    private Instant coolingEndsAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BeneficiaryStatus status = BeneficiaryStatus.ACTIVE;

    @Column(name = "transfer_limit", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal transferLimit = new BigDecimal("1000.0000");

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public boolean isCoolingActive() {
        return coolingEndsAt != null && coolingEndsAt.isAfter(Instant.now());
    }
}
