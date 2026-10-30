package com.vaultpay.exception;

import com.vaultpay.common.ErrorCode;
import org.springframework.http.HttpStatus;

public class AccountFrozenException extends BusinessException {
    public AccountFrozenException(String message) {
        super(message, ErrorCode.ACCOUNT_FROZEN, HttpStatus.FORBIDDEN);
    }
}
