package com.vaultpay.modules.auth;

import com.vaultpay.common.ErrorCode;
import com.vaultpay.config.JwtProperties;
import com.vaultpay.exception.BusinessException;
import com.vaultpay.modules.account.AccountEntity;
import com.vaultpay.modules.account.AccountRepository;
import com.vaultpay.modules.account.AccountStatus;
import com.vaultpay.modules.account.AccountType;
import com.vaultpay.modules.auth.dto.AuthResponse;
import com.vaultpay.modules.auth.dto.LoginRequest;
import com.vaultpay.modules.auth.dto.RefreshTokenRequest;
import com.vaultpay.modules.auth.dto.RegisterRequest;
import com.vaultpay.modules.user.RefreshTokenEntity;
import com.vaultpay.modules.user.RefreshTokenRepository;
import com.vaultpay.modules.user.Role;
import com.vaultpay.modules.user.UserEntity;
import com.vaultpay.modules.user.UserRepository;
import com.vaultpay.modules.user.UserStatus;
import com.vaultpay.security.JwtTokenProvider;
import com.vaultpay.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;
    private final LoginAttemptService loginAttemptService;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("Username already in use", ErrorCode.VALIDATION_ERROR, HttpStatus.CONFLICT);
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email already in use", ErrorCode.VALIDATION_ERROR, HttpStatus.CONFLICT);
        }

        UserEntity user = UserEntity.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .role(Role.ROLE_CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();

        UserEntity savedUser = userRepository.save(user);

        // Auto-generate default checking account for new user with simulated sign-up grant (₹1,000.00)
        String accountNumber = generateUniqueAccountNumber();
        AccountEntity defaultAccount = AccountEntity.builder()
                .user(savedUser)
                .accountNumber(accountNumber)
                .accountType(AccountType.CHECKING)
                .currency("INR")
                .availableBalance(new BigDecimal("1000.0000"))
                .ledgerBalance(new BigDecimal("1000.0000"))
                .dailyTransferLimit(new BigDecimal("50000.0000"))
                .status(AccountStatus.ACTIVE)
                .build();
        accountRepository.save(defaultAccount);

        String accessToken = jwtTokenProvider.generateTokenFromUsername(savedUser.getUsername(), savedUser.getId(), savedUser.getRole().name());
        String refreshToken = createAndSaveRefreshToken(savedUser);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtProperties.getAccessTokenExpirationMs() / 1000)
                .userId(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .role(savedUser.getRole().name())
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        UserEntity user = userRepository.findByUsername(request.getUsernameOrEmail())
                .or(() -> userRepository.findByEmail(request.getUsernameOrEmail()))
                .orElse(null);

        if (user == null) {
            loginAttemptService.recordFailure(request.getUsernameOrEmail(), ipAddress, userAgent, "User not found");
            throw new BadCredentialsException("Invalid username or password");
        }

        if (!user.isAccountNonLocked()) {
            loginAttemptService.recordFailure(user.getUsername(), ipAddress, userAgent, "Account locked");
            throw new LockedException("Account is locked due to repeated failed login attempts. Please try again later.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword())
            );

            loginAttemptService.recordSuccess(user, ipAddress, userAgent);

            String accessToken = jwtTokenProvider.generateAccessToken(authentication);
            String refreshToken = createAndSaveRefreshToken(user);

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .expiresIn(jwtProperties.getAccessTokenExpirationMs() / 1000)
                    .userId(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .role(user.getRole().name())
                    .build();

        } catch (BadCredentialsException ex) {
            loginAttemptService.recordFailure(user.getUsername(), ipAddress, userAgent, "Invalid password");
            throw ex;
        }
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshTokenEntity storedToken = refreshTokenRepository.findByTokenHash(request.getRefreshToken())
                .orElseThrow(() -> new BusinessException("Invalid refresh token", ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED));

        if (storedToken.isRevoked() || storedToken.isExpired()) {
            throw new BusinessException("Refresh token is expired or revoked", ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
        }

        UserEntity user = storedToken.getUser();
        // Rotate token: revoke old one, generate new one
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        String newAccessToken = jwtTokenProvider.generateTokenFromUsername(user.getUsername(), user.getId(), user.getRole().name());
        String newRefreshToken = createAndSaveRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .expiresIn(jwtProperties.getAccessTokenExpirationMs() / 1000)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().name())
                .build();
    }

    @Transactional
    public void logout(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("User not found", ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND));
        refreshTokenRepository.revokeAllUserTokens(user);
    }

    private String createAndSaveRefreshToken(UserEntity user) {
        String token = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        Instant expiresAt = Instant.now().plus(jwtProperties.getRefreshTokenExpirationMs(), ChronoUnit.MILLIS);

        RefreshTokenEntity entity = RefreshTokenEntity.builder()
                .user(user)
                .tokenHash(token)
                .expiresAt(expiresAt)
                .revoked(false)
                .build();

        refreshTokenRepository.save(entity);
        return token;
    }

    private String generateUniqueAccountNumber() {
        String accNum;
        do {
            accNum = "VP-" + (1000000 + RANDOM.nextInt(9000000));
        } while (accountRepository.existsByAccountNumber(accNum));
        return accNum;
    }
}
