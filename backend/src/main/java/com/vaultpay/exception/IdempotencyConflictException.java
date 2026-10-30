package com.vaultpay.exception;

import com.vaultpay.common.ErrorCode;
import org.springframework.http.HttpStatus;

public class IdempotencyConflictException extends BusinessException {
    public IdempotencyConflictException(String message) {
        super(message, ErrorCode.IDEMPOTENCY_CONFLICT, HttpStatus.CONFLICT);
    }
}
