# VaultPay - API Documentation & Endpoints

All APIs adhere to REST conventions and return standardized responses:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2026-10-30T14:00:00Z"
}
```

Interactive Swagger / OpenAPI UI documentation is available at:
- Local: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON Spec: `http://localhost:8080/v3/api-docs`

---

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new customer & auto-provision checking account | No |
| `POST` | `/api/auth/login` | Authenticate with username/password, returns JWT & Refresh token | No |
| `POST` | `/api/auth/refresh` | Rotate refresh token and issue new access token | No |
| `POST` | `/api/auth/logout` | Revoke user refresh tokens & invalidate session | Yes |

---

## 2. Bank Accounts (`/api/accounts`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/accounts` | List accounts belonging to authenticated user | Customer / Admin |
| `POST` | `/api/accounts` | Open a new checking, savings, or business account | Customer / Admin |
| `GET` | `/api/accounts/{id}` | Get account details by ID | Account Holder / Admin |
| `GET` | `/api/accounts/{accountNumber}/balance` | Real-time balance lookup | Account Holder / Admin |
| `PATCH` | `/api/accounts/{id}/freeze` | Freeze account (suspends transfers) | Account Holder / Admin |
| `PATCH` | `/api/accounts/{id}/unfreeze` | Unfreeze / reactivate account | Account Holder / Admin |

---

## 3. Money Transfers (`/api/transfers`)

| Method | Endpoint | Description | Headers |
|---|---|---|---|
| `POST` | `/api/transfers` | Execute money transfer between accounts | `Idempotency-Key: <UUID>` |
| `GET` | `/api/transfers` | Paginated transaction history with status/date filters | `Authorization: Bearer <JWT>` |
| `GET` | `/api/transfers/reference/{reference}` | Get official ledger transaction receipt | `Authorization: Bearer <JWT>` |

### Sample Transfer Payload
```json
{
  "sourceAccountNumber": "VP-1000101",
  "destinationAccountNumber": "VP-2000201",
  "amount": 250.00,
  "currency": "USD",
  "description": "Invoice reimbursement"
}
```

---

## 4. Beneficiaries (`/api/beneficiaries`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/beneficiaries` | List current user's registered beneficiaries |
| `POST` | `/api/beneficiaries` | Add new beneficiary (triggers 24h cooling period) |
| `DELETE`| `/api/beneficiaries/{id}`| Remove beneficiary |

---

## 5. Scheduled Payments (`/api/scheduled-payments`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/scheduled-payments` | List user scheduled recurring transfers |
| `POST` | `/api/scheduled-payments` | Schedule future or recurring payment (ONCE, WEEKLY, MONTHLY) |
| `DELETE`| `/api/scheduled-payments/{id}`| Cancel scheduled payment |
| `POST` | `/api/scheduled-payments/trigger-run`| Force immediate execution of due scheduled payments |

---

## 6. Financial Analytics (`/api/analytics`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics/summary` | Net cash flow, balance, total in/out, success rate |
| `GET` | `/api/analytics/monthly` | 6-month comparative inflow vs outflow |
| `GET` | `/api/analytics/categories` | Spending breakdown by categorized expenses |
| `GET` | `/api/analytics/daily` | 14-day daily spending timeline |

---

## 7. Backoffice Administration (`/api/admin`)
*Requires `ROLE_ADMIN` or `ROLE_SUPPORT`*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | Platform-wide volume, total liquidity, open fraud alerts |
| `GET` | `/api/admin/users` | Search and filter registered users |
| `PATCH` | `/api/admin/users/{id}/status` | Lock, unlock, or suspend user |
| `GET` | `/api/admin/accounts` | Search all bank accounts |
| `PATCH` | `/api/admin/accounts/{id}/status` | Freeze or reactivate any account |
| `GET` | `/api/admin/transactions` | Search transactions by reference |
| `GET` | `/api/admin/fraud-alerts` | List alerts flagged by rule engine |
| `PATCH` | `/api/admin/fraud-alerts/{id}/review` | Resolve alert as False Positive or Confirmed Fraud |
| `GET` | `/api/admin/audit-logs` | View tamper-evident security audit trails |
