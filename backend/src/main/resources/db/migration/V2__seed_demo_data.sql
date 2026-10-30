-- =============================================================================
-- VaultPay Seed Demo Data - V2__seed_demo_data.sql
-- Default accounts for Customer, Admin, Support, and System Reserve
-- Default password for all users: Password123!
-- =============================================================================

-- Seed Users
-- Passwords will also be validated / refreshed by DataInitializer on boot
INSERT INTO users (id, username, email, password_hash, first_name, last_name, phone, role, status)
VALUES 
(1, 'system_reserve', 'reserve@vaultpay.internal', '$2a$10$3zHzb.NTr1abeVN8zAusWe2CQGfCbgmKF3K4u5OQe2o0.Vd3c8cCe', 'System', 'Reserve', '+10000000000', 'ROLE_ADMIN', 'ACTIVE'),
(2, 'admin', 'admin@vaultpay.internal', '$2a$10$3zHzb.NTr1abeVN8zAusWe2CQGfCbgmKF3K4u5OQe2o0.Vd3c8cCe', 'Chief', 'Administrator', '+15550000001', 'ROLE_ADMIN', 'ACTIVE'),
(3, 'support', 'support@vaultpay.internal', '$2a$10$3zHzb.NTr1abeVN8zAusWe2CQGfCbgmKF3K4u5OQe2o0.Vd3c8cCe', 'Support', 'Agent', '+15550000002', 'ROLE_SUPPORT', 'ACTIVE'),
(4, 'alex', 'alex@vaultpay.internal', '$2a$10$3zHzb.NTr1abeVN8zAusWe2CQGfCbgmKF3K4u5OQe2o0.Vd3c8cCe', 'Alex', 'Mercer', '+15550192831', 'ROLE_CUSTOMER', 'ACTIVE'),
(5, 'sarah', 'sarah@vaultpay.internal', '$2a$10$3zHzb.NTr1abeVN8zAusWe2CQGfCbgmKF3K4u5OQe2o0.Vd3c8cCe', 'Sarah', 'Connor', '+15550192832', 'ROLE_CUSTOMER', 'ACTIVE');

-- Seed Accounts
-- System Reserve: Account 1 (VP-0000001) with massive liquidity pool
-- Alex: Account 2 (Checking VP-1000101) ₹15,450.00, Account 3 (Savings VP-1000102) ₹32,000.00
-- Sarah: Account 4 (Checking VP-2000201) ₹8,750.00
INSERT INTO accounts (id, user_id, account_number, account_type, currency, available_balance, ledger_balance, daily_transfer_limit, status)
VALUES
(1, 1, 'VP-0000001', 'BUSINESS', 'INR', 10000000.0000, 10000000.0000, 10000000.0000, 'ACTIVE'),
(2, 4, 'VP-1000101', 'CHECKING', 'INR', 15450.0000, 15450.0000, 100000.0000, 'ACTIVE'),
(3, 4, 'VP-1000102', 'SAVINGS', 'INR', 32000.0000, 32000.0000, 250000.0000, 'ACTIVE'),
(4, 5, 'VP-2000201', 'CHECKING', 'INR', 8750.0000, 8750.0000, 100000.0000, 'ACTIVE');

-- Seed Initial Double-Entry Funding Transactions (Total Debit = Total Credit)
-- Tx 1: Funding Alex Checking (₹15,450)
INSERT INTO transactions (id, reference, idempotency_key, sender_account_id, receiver_account_id, amount, currency, fee, type, status, description, created_at, completed_at)
VALUES (1, 'TX-INIT-001', 'IDEMP-INIT-001', 1, 2, 15450.0000, 'INR', 0.0000, 'DEPOSIT', 'SUCCESS', 'Initial Account Opening Funding', NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY);

INSERT INTO ledger_entries (id, transaction_id, account_id, entry_type, amount, balance_after, created_at)
VALUES 
(1, 1, 1, 'DEBIT', 15450.0000, 9984550.0000, NOW() - INTERVAL 10 DAY),
(2, 1, 2, 'CREDIT', 15450.0000, 15450.0000, NOW() - INTERVAL 10 DAY);

-- Tx 2: Funding Alex Savings (₹32,000)
INSERT INTO transactions (id, reference, idempotency_key, sender_account_id, receiver_account_id, amount, currency, fee, type, status, description, created_at, completed_at)
VALUES (2, 'TX-INIT-002', 'IDEMP-INIT-002', 1, 3, 32000.0000, 'INR', 0.0000, 'DEPOSIT', 'SUCCESS', 'Initial Savings Funding', NOW() - INTERVAL 9 DAY, NOW() - INTERVAL 9 DAY);

INSERT INTO ledger_entries (id, transaction_id, account_id, entry_type, amount, balance_after, created_at)
VALUES 
(3, 2, 1, 'DEBIT', 32000.0000, 9952550.0000, NOW() - INTERVAL 9 DAY),
(4, 2, 3, 'CREDIT', 32000.0000, 32000.0000, NOW() - INTERVAL 9 DAY);

-- Tx 3: Funding Sarah Checking (₹9,000)
INSERT INTO transactions (id, reference, idempotency_key, sender_account_id, receiver_account_id, amount, currency, fee, type, status, description, created_at, completed_at)
VALUES (3, 'TX-INIT-003', 'IDEMP-INIT-003', 1, 4, 9000.0000, 'INR', 0.0000, 'DEPOSIT', 'SUCCESS', 'Initial Account Opening Funding', NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 8 DAY);

INSERT INTO ledger_entries (id, transaction_id, account_id, entry_type, amount, balance_after, created_at)
VALUES 
(5, 3, 1, 'DEBIT', 9000.0000, 9943550.0000, NOW() - INTERVAL 8 DAY),
(6, 3, 4, 'CREDIT', 9000.0000, 9000.0000, NOW() - INTERVAL 8 DAY);

-- Tx 4: Sarah transferred ₹250 to Alex
INSERT INTO transactions (id, reference, idempotency_key, sender_account_id, receiver_account_id, amount, currency, fee, type, status, description, created_at, completed_at)
VALUES (4, 'TX-DEMO-004', 'IDEMP-DEMO-004', 4, 2, 250.0000, 'INR', 0.0000, 'TRANSFER', 'SUCCESS', 'Dinner split reimbursement', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY);

INSERT INTO ledger_entries (id, transaction_id, account_id, entry_type, amount, balance_after, created_at)
VALUES 
(7, 4, 4, 'DEBIT', 250.0000, 8750.0000, NOW() - INTERVAL 2 DAY),
(8, 4, 2, 'CREDIT', 250.0000, 15450.0000, NOW() - INTERVAL 2 DAY);

-- Seed Beneficiaries for Alex
INSERT INTO beneficiaries (id, user_id, target_account_number, beneficiary_name, nickname, bank_name, status, cooling_ends_at, transfer_limit)
VALUES 
(1, 4, 'VP-2000201', 'Sarah Connor', 'Sarah C.', 'VaultPay', 'ACTIVE', NOW() - INTERVAL 5 DAY, 50000.0000);

-- Seed Beneficiary for Sarah
INSERT INTO beneficiaries (id, user_id, target_account_number, beneficiary_name, nickname, bank_name, status, cooling_ends_at, transfer_limit)
VALUES 
(2, 5, 'VP-1000101', 'Alex Mercer', 'Alex Checking', 'VaultPay', 'ACTIVE', NOW() - INTERVAL 5 DAY, 50000.0000);

-- Seed Sample Notifications
INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, created_at)
VALUES
(4, 'Payment Received', 'You received ₹250.00 from Sarah Connor for Dinner split reimbursement.', 'TRANSFER_RECEIVED', FALSE, 'TX-DEMO-004', NOW() - INTERVAL 2 DAY),
(4, 'Account Opened', 'Welcome to VaultPay! Your Checking Account VP-1000101 has been activated.', 'SECURITY_ALERT', TRUE, 'VP-1000101', NOW() - INTERVAL 10 DAY),
(5, 'Transfer Successful', 'You sent ₹250.00 to Alex Mercer.', 'TRANSFER_SENT', TRUE, 'TX-DEMO-004', NOW() - INTERVAL 2 DAY);

-- Seed Sample Audit Log
INSERT INTO audit_logs (user_id, username, action, resource_type, resource_id, ip_address, details, status, created_at)
VALUES
(2, 'admin', 'SYSTEM_INITIALIZATION', 'SYSTEM', 'VAULTPAY-CORE', '127.0.0.1', 'System ledger and core liquidity seeded successfully', 'SUCCESS', NOW() - INTERVAL 10 DAY);
