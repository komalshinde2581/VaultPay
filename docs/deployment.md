# VaultPay - Deployment & Operations Guide

## 1. Quick Start via Docker Compose (Recommended)

VaultPay is fully containerized. A single command provisions the complete platform including MySQL 8, Redis 7, Apache Kafka KRaft, the Spring Boot Backend, and the React Frontend with Nginx.

### Prerequisites
- Docker (v24+) & Docker Compose (v2+)

### Launching the Platform

```bash
# 1. Clone repository and navigate to root
git clone <repo-url>
cd vaultpay

# 2. Configure environment (optional, defaults are pre-configured)
cp .env.example .env

# 3. Build images and start all services in background
docker compose up --build -d

# 4. Verify running health status
docker compose ps
```

### Accessing the Platform

- **Frontend Banking Web App**: `http://localhost:3000`
- **Backend API Server**: `http://localhost:8080`
- **Interactive Swagger OpenAPI**: `http://localhost:8080/swagger-ui.html`
- **Spring Actuator Health**: `http://localhost:8080/actuator/health`

---

## 2. Local Development Without Docker

### Prerequisites
- Java 17+ (Eclipse Temurin / OpenJDK)
- Node.js 20+ & npm 10+
- MySQL 8.0 (or in-memory H2 mode)

### Backend Local Run
```bash
cd backend

# Option A: Standalone in-memory testing mode
./mvnw spring-boot:run -Dspring-boot.run.profiles=test

# Option B: Local MySQL mode
./mvnw spring-boot:run
```

### Frontend Local Run
```bash
cd frontend

# Install packages
npm install

# Start Vite hot-reloading dev server
npm run dev
```
Navigate to `http://localhost:3000`.

---

## 3. Demo Accounts & Seed Credentials

| Role | Username | Password | Purpose |
|---|---|---|---|
| **Customer** | `alex` | `Password123!` | Customer with Checking ($15,450) and Savings ($32,000) accounts |
| **Customer** | `sarah` | `Password123!` | Customer with Checking account ($8,750) |
| **Admin** | `admin` | `Password123!` | Full administrative access to fraud triage, accounts, and audits |
| **Support** | `support` | `Password123!` | Backoffice support with user lookup and read access |

---

## 4. Production Hardening Checklist

1. **Rotate Secrets**: Generate a cryptographically secure 256-bit key for `JWT_SECRET` (`openssl rand -hex 32`).
2. **Database Credentials**: Replace default passwords in `.env` and `docker-compose.yml`.
3. **SSL / TLS**: Terminate HTTPS at the ingress reverse proxy (AWS ALB, Cloudflare, or Nginx Certbot).
4. **CORS Allowlist**: Restrict `allowedOriginPatterns` in `WebMvcConfig.java` to production domain.
5. **Rate Limiting**: Enable Redis-backed distributed rate limit thresholds for public authentication endpoints.
