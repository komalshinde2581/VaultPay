# VaultPay - System Architecture & Engineering Specifications

## 1. High-Level Architectural Overview

VaultPay is designed as a **Modular Monolith** applying Domain-Driven Design (DDD) principles. It bridges synchronous customer transactional interactions with asynchronous event-driven pipelines via a Transactional Outbox.

```
                           +---------------------------+
                           |   React 19 + TypeScript   |
                           |   Tailwind CSS / Vite     |
                           +-------------+-------------+
                                         |
                                  HTTPS / WSS
                                         |
                                         v
                           +---------------------------+
                           |  Spring Boot 3.3.4 (Java) |
                           +-------------+-------------+
                                         |
                     +-------------------+-------------------+
                     |                   |                   |
                     v                   v                   v
           +-------------------+ +---------------+ +-------------------+
           |      MySQL 8      | |    Redis 7    | |    Apache Kafka   |
           | Double-Entry      | | Caching,      | | Transactional     |
           | Ledger & Outbox   | | Rate Limiting | | Outbox Events     |
           +-------------------+ +---------------+ +-------------------+
```

---

## 2. Core Architectural Patterns

### 2.1 Strict Double-Entry Bookkeeping Ledger
Financial integrity is guaranteed through double-entry accounting:
- **Debit Entry**: Deducted from the sending account.
- **Credit Entry**: Added to the recipient account.
- **Invariant**:
  $$\sum \text{Debit} = \sum \text{Credit}$$
- Entries are strictly **append-only and immutable**. Once recorded in `ledger_entries`, they cannot be updated or deleted. Corrections require posting compensating reversal transactions.
- All monetary amounts use Java `BigDecimal` with scale 4 (`DECIMAL(19,4)` in MySQL) to eliminate floating-point precision loss.

### 2.2 Concurrency & Race-Condition Prevention
To eliminate race conditions, double-spending, and negative balances under simultaneous withdrawal requests:
1. **Deterministic Row Locking**: When processing a transfer between Account A and Account B, locks are always acquired in order of their primary key (`min(A.id, B.id)` first, then `max(A.id, B.id)`). This guarantees database deadlocks cannot occur even when two users transfer money to each other at the exact same millisecond.
2. **Pessimistic Write Locks**: Evaluated using `@Lock(LockModeType.PESSIMISTIC_WRITE)` (`SELECT ... FOR UPDATE`).
3. **Atomic Balance Mutation**:
   ```sql
   UPDATE accounts 
   SET available_balance = available_balance - :amount, 
       ledger_balance = ledger_balance - :amount 
   WHERE id = :id AND available_balance >= :amount;
   ```

### 2.3 Idempotency Key Pattern
- All transfer requests require an `Idempotency-Key` header (e.g. UUID).
- The hash of the request payload and the resulting transaction response are cached in MySQL `idempotency_records` table with a 24-hour expiration window.
- Retried requests with the same key safely return the original transaction receipt without duplicating money movement.

### 2.4 Transactional Outbox Pattern with Apache Kafka
To guarantee atomicity between MySQL database state and Kafka event publication:
1. When a transaction succeeds, an event record is written into the `outbox_events` table inside the **same local database transaction**.
2. An asynchronous worker (`OutboxRelayScheduler`) polls pending outbox records and publishes them to Kafka topics (`vaultpay.transactions`, `vaultpay.fraud`, `vaultpay.notifications`).
3. If Kafka is temporarily unreachable, the database transaction remains committed, and events will be delivered upon reconnect (guaranteeing at-least-once delivery).

### 2.5 Multi-Tier Fraud Detection Engine
Transactions are analyzed against configurable heuristic rules before funds move:
- **Rule 1: Large Transfer Audit**: Flags single transfers $\ge \$10,000$.
- **Rule 2: Rapid Burst Velocity**: Flags more than 3 transfers from the same account within a 5-minute rolling window.
- **Rule 3: Daily Velocity Threshold**: Flags cumulative 24-hour transfers approaching $\$25,000$.
- **Rule 4: Cooling Period Limit**: Restricts transfers to newly added beneficiaries during their initial 24-hour verification window.
