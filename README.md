# 🏦 VaultPay - Enterprise Digital Banking & Payment Simulation Platform

[![Spring Boot 3.3.4](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java 17](https://img.shields.io/badge/Java-17-blue.svg)](https://openjdk.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![MySQL 8](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-7%20Alpine-red.svg)](https://redis.io/)
[![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-KRaft-black.svg)](https://kafka.apache.org/)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-Ready-2496ed.svg)](https://docs.docker.com/compose/)

> **VaultPay** is a full-stack, enterprise-grade digital banking and financial payment platform engineered with institutional-grade transaction processing, immutable double-entry ledger bookkeeping, deterministic concurrency locking, rule-based fraud detection, automated recurring payments, transactional outbox Kafka streaming, and a responsive React frontend.

---

## 🌟 Key Engineering Highlights

### 1. ⚖️ Strict Double-Entry Ledger Bookkeeping
- Every fund movement generates two immutable entries: **DEBIT** on the sender and **CREDIT** on the recipient.
- The fundamental accounting invariant is strictly enforced at application and database layers:
  $$\sum \text{Debit} = \sum \text{Credit}$$
- All balances use `BigDecimal` with 4 decimal places of internal precision (`DECIMAL(19,4)` in MySQL) with `HALF_EVEN` rounding to prevent floating-point drift.

### 2. 🔒 Concurrency & Race-Condition Prevention
- Account balances are protected from race conditions and overspending during simultaneous withdrawals via **Pessimistic Write Locking** (`@Lock(LockModeType.PESSIMISTIC_WRITE)`).
- Deadlocks are prevented by deterministically sorting account IDs (`min(A.id, B.id)` first, then `max(A.id, B.id)`) before acquiring database locks.

### 3. 🔑 Idempotency Key Pattern
- All transfer operations require an `Idempotency-Key` HTTP header.
- Cached SHA-256 hashes of the request payload and responses prevent duplicate deductions on network retries or double clicks.

### 4. 📦 Transactional Outbox Pattern with Apache Kafka
- Transaction events are written to an `outbox_events` table inside the same local database transaction as the financial transfer.
- An asynchronous relay publisher broadcasts events to Kafka topics (`vaultpay.transactions`, `vaultpay.fraud`, `vaultpay.notifications`), guaranteeing at-least-once delivery without distributed two-phase commits.

### 5. 🛡️ Multi-Tier Fraud Detection Engine
- Transactions are checked against configurable risk rules:
  - **Large Transaction Detection**: Flags single transfers $\ge \$10,000$.
  - **Rapid Velocity Check**: Flags accounts making $>3$ transfers in a 5-minute rolling window.
  - **24-Hour Velocity Check**: Flags accounts approaching $\$25,000$ in 24 hours.
  - **Beneficiary Cooling Period**: Enforces a temporary $\$1,000$ transfer cap on newly added payees for 24 hours.

### 6. ⚡ Real-Time WebSocket Alerts & Scheduled Payments
- Real-time in-app notifications stream directly to the browser via WebSocket.
- Automated recurring transfers (Once, Weekly, Monthly) run via Spring Boot Scheduler.

---

## 🚀 Quick Start (Docker Compose)

The entire platform—including MySQL, Redis, Kafka, Spring Boot backend, and React frontend—runs with a single command:

```bash
# 1. Clone repository
git clone https://github.com/komalshinde2581/VaultPay.git
cd VaultPay

# 2. Start all services
docker compose up --build -d
```

### URLs & Ports
- 🌐 **Customer Banking Web App**: [http://localhost:3000](http://localhost:3000)
- ⚙️ **Spring Boot REST API**: [http://localhost:8080](http://localhost:8080)
- 📖 **Swagger / OpenAPI 3 Documentation**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- 🩺 **Spring Actuator Health**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

---

## 👥 Preloaded Demo Credentials

All accounts are pre-seeded with the default password: **`Password123!`**

| Role | Username | Initial Liquidity | Features to Explore |
|---|---|---|---|
| **Customer** | `alex` | **$47,450.00** | Checking ($15.4k) + Savings ($32k), transaction history, P2P transfer, beneficiaries |
| **Customer** | `sarah` | **$8,750.00** | Checking account, split reimbursement demo, scheduled payments |
| **Administrator** | `admin` | **$10,000,000.00** | System liquidity overview, user directory, fraud triage queue, audit trails |
| **Support** | `support` | — | User lookup, customer account verification, transaction monitoring |

*The login page also includes **One-Click Demo Login** buttons for instant access without typing.*

---

## 🛠️ Tech Stack & Architecture

### Backend
- **Framework**: Spring Boot 3.3.4 (Java 17 LTS)
- **Security**: Spring Security 6, Stateless JWT (JJWT 0.12.6), BCrypt hashing, Account Lockout
- **Persistence**: Spring Data JPA, Hibernate, MySQL 8, Flyway Migrations
- **Distributed Systems**: Apache Kafka (KRaft mode), Redis 7 (Lettuce), Transactional Outbox
- **Real-Time**: Spring WebSocket
- **Testing**: JUnit 5, Mockito, AssertJ

### Frontend
- **Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 3.4 (Fintech Navy/Blue theme), Lucide React
- **Data Visualization**: Recharts (Cashflow area charts, monthly volume bars, spending category pies)
- **HTTP Client**: Axios with automatic JWT refresh-token rotation and Idempotency key injection
- **Routing**: React Router 7

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── src/main/java/com/vaultpay/
│   │   ├── common/           # ApiResponse, PagedResponse, ErrorCodes
│   │   ├── config/           # Security, Kafka, Redis, WebSocket, OpenAPI, DataInitializer
│   │   ├── exception/        # GlobalExceptionHandler & financial exceptions
│   │   ├── security/         # JwtTokenProvider, JwtAuthFilter, UserPrincipal
│   │   └── modules/
│   │       ├── auth/         # Register, Login, RefreshToken, Lockout
│   │       ├── user/         # UserEntity, Profile, Password rotation
│   │       ├── account/      # Bank accounts, balances, freeze/unfreeze
│   │       ├── transfer/     # Pessimistic locking transfer engine, Idempotency
│   │       ├── ledger/       # Immutable double-entry bookkeeping (Debit/Credit)
│   │       ├── beneficiary/  # Beneficiary directory & cooling period checks
│   │       ├── fraud/        # Rule-based fraud detection engine & alerts
│   │       ├── scheduled/    # Recurring payment scheduler
│   │       ├── notification/ # In-app notification & WebSocket handler
│   │       ├── analytics/    # Ledger financial analytics & aggregates
│   │       ├── admin/        # Backoffice stats, user control, fraud triage
│   │       ├── audit/        # Tamper-evident audit logging
│   │       └── outbox/       # Transactional outbox & Kafka relay scheduler
│   ├── src/main/resources/
│   │   ├── db/migration/     # Flyway V1 schema (14 tables) & V2 seed data
│   │   └── application.yml
│   ├── src/test/java/        # JUnit & Mockito unit/concurrency tests
│   ├── pom.xml
│   ├── mvnw & mvnw.cmd
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios client with token interceptors & API services
│   │   ├── context/          # AuthContext & WebSocket NotificationContext
│   │   ├── components/       # Common UI (Badges, StatCards, Modals, Receipts) & Layouts
│   │   ├── pages/
│   │   │   ├── public/       # LandingPage, LoginPage, RegisterPage
│   │   │   ├── customer/     # Dashboard, Accounts, SendMoney, Beneficiaries, etc.
│   │   │   └── admin/        # AdminDashboard, Users, Accounts, FraudAlerts, Audits
│   │   └── types/            # TypeScript interfaces
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── nginx.conf
│   └── Dockerfile
├── docs/
│   ├── architecture.md       # Detailed technical architecture specifications
│   ├── database-design.md    # ER diagram & table schemas
│   ├── api-documentation.md  # REST API specification
│   └── deployment.md         # Deployment & operations guide
├── .github/workflows/ci.yml  # GitHub Actions CI pipeline
├── docker-compose.yml        # Full-stack composition
└── README.md
```

---

## 🧪 Running Tests

### Backend Unit & Concurrency Tests
```bash
cd backend
./mvnw test
```
All tests verify double-entry balance equality, insufficient funds protection, self-transfer blocking, and fraud engine limit evaluations.

### Frontend Production Build Test
```bash
cd frontend
npm run build
```

---

## 📚 Technical Documentation

For in-depth architectural and operational information:
- [System Architecture](docs/architecture.md)
- [Database Schema & Design](docs/database-design.md)
- [REST API Documentation](docs/api-documentation.md)
- [Deployment Guide](docs/deployment.md)

---

## ⚖️ License
This project is open-source under the [Apache 2.0 License](LICENSE). Built for enterprise fintech demonstration and portfolio showcase.
