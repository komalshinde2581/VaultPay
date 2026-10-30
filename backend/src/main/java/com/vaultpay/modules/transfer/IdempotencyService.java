package com.vaultpay.modules.transfer;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final IdempotencyRepository idempotencyRepository;
    private final ObjectMapper objectMapper;

    private static final int EXPIRATION_HOURS = 24;

    @Transactional(readOnly = true)
    public Optional<IdempotencyRecordEntity> getValidRecord(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }
        return idempotencyRepository.findByIdempotencyKey(idempotencyKey)
                .filter(record -> !record.isExpired());
    }

    @Transactional
    public void record(String idempotencyKey, Long userId, Object requestPayload, int statusCode, Object responsePayload) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return;
        }

        try {
            String requestJson = objectMapper.writeValueAsString(requestPayload);
            String hash = calculateSha256(requestJson);
            String responseJson = objectMapper.writeValueAsString(responsePayload);

            IdempotencyRecordEntity record = IdempotencyRecordEntity.builder()
                    .idempotencyKey(idempotencyKey)
                    .userId(userId)
                    .requestHash(hash)
                    .statusCode(statusCode)
                    .responseBody(responseJson)
                    .expiresAt(Instant.now().plus(EXPIRATION_HOURS, ChronoUnit.HOURS))
                    .build();

            idempotencyRepository.save(record);
            log.info("Saved idempotency record for key: {}", idempotencyKey);
        } catch (Exception e) {
            log.error("Failed to store idempotency record for key {}", idempotencyKey, e);
        }
    }

    public String calculateSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return "";
        }
    }
}
