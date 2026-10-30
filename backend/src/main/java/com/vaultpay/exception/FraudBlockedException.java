package com.vaultpay.exception;

import com.vaultpay.common.ErrorCode;
import org.springframework.http.HttpStatus;

public class FraudBlockedException extends BusinessException {
    public FraudBlockedException(String message) {
        super(message, ErrorCode.FRAUD_SUSPECTED, HttpStatus.FORBIDDEN);
    }
}
