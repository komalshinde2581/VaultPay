package com.vaultpay.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "vaultpay.jwt")
public class JwtProperties {
    private String secret;
    private long accessTokenExpirationMs = 900000; // 15 mins
    private long refreshTokenExpirationMs = 604800000; // 7 days
}
