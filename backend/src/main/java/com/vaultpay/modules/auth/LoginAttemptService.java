package com.vaultpay.modules.auth;

import com.vaultpay.modules.user.LoginHistoryEntity;
import com.vaultpay.modules.user.LoginHistoryRepository;
import com.vaultpay.modules.user.UserEntity;
import com.vaultpay.modules.user.UserRepository;
import com.vaultpay.modules.user.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final int LOCKOUT_DURATION_MINUTES = 15;

    private final UserRepository userRepository;
    private final LoginHistoryRepository loginHistoryRepository;

    @Transactional
    public void recordSuccess(UserEntity user, String ipAddress, String userAgent) {
        user.setFailedAttempts(0);
        user.setStatus(UserStatus.ACTIVE);
        user.setLockUntil(null);
        userRepository.save(user);

        loginHistoryRepository.save(LoginHistoryEntity.builder()
                .userId(user.getId())
                .usernameAttempted(user.getUsername())
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .status("SUCCESS")
                .build());
    }

    @Transactional
    public void recordFailure(String username, String ipAddress, String userAgent, String reason) {
        userRepository.findByUsername(username).ifPresent(user -> {
            int newAttempts = user.getFailedAttempts() + 1;
            user.setFailedAttempts(newAttempts);

            if (newAttempts >= MAX_ATTEMPTS) {
                user.setStatus(UserStatus.LOCKED);
                user.setLockUntil(Instant.now().plus(LOCKOUT_DURATION_MINUTES, ChronoUnit.MINUTES));
                log.warn("Account locked for user '{}' due to repeated failed logins. Locked for {} minutes.", username, LOCKOUT_DURATION_MINUTES);
            }
            userRepository.save(user);
        });

        loginHistoryRepository.save(LoginHistoryEntity.builder()
                .usernameAttempted(username)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .status("FAILED")
                .failureReason(reason)
                .build());
    }
}
