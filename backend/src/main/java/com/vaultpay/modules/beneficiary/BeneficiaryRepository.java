package com.vaultpay.modules.beneficiary;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BeneficiaryRepository extends JpaRepository<BeneficiaryEntity, Long> {
    List<BeneficiaryEntity> findByUserIdAndStatusNot(Long userId, BeneficiaryStatus status);
    Optional<BeneficiaryEntity> findByUserIdAndTargetAccountNumberAndStatusNot(Long userId, String targetAccountNumber, BeneficiaryStatus status);
    boolean existsByUserIdAndTargetAccountNumberAndStatusNot(Long userId, String targetAccountNumber, BeneficiaryStatus status);
}
