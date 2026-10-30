// VaultPay TypeScript Definitions

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'ROLE_CUSTOMER' | 'ROLE_ADMIN' | 'ROLE_SUPPORT';
  status: 'ACTIVE' | 'LOCKED' | 'SUSPENDED';
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ROLE_CUSTOMER' | 'ROLE_ADMIN' | 'ROLE_SUPPORT';
}

export interface Account {
  id: number;
  userId: number;
  accountHolderName: string;
  accountNumber: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'BUSINESS';
  currency: string;
  availableBalance: number;
  ledgerBalance: number;
  dailyTransferLimit: number;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  createdAt: string;
}

export interface TransactionReceipt {
  id: number;
  reference: string;
  idempotencyKey?: string;
  senderAccountNumber: string;
  senderName: string;
  receiverAccountNumber: string;
  receiverName: string;
  amount: number;
  fee: number;
  currency: string;
  type: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REVERSED';
  description?: string;
  failureReason?: string;
  createdAt: string;
  completedAt?: string;
}

export interface TransferRequest {
  sourceAccountNumber: string;
  destinationAccountNumber: string;
  amount: number;
  currency?: string;
  description?: string;
}

export interface TransferResponse {
  transactionReference: string;
  status: string;
  sourceAccountNumber: string;
  destinationAccountNumber: string;
  recipientName: string;
  amount: number;
  fee: number;
  currency: string;
  remainingBalance: number;
  description?: string;
  timestamp: string;
}

export interface Beneficiary {
  id: number;
  targetAccountNumber: string;
  beneficiaryName: string;
  nickname?: string;
  bankName: string;
  status: 'ACTIVE' | 'PENDING_COOLING' | 'DELETED';
  coolingActive: boolean;
  coolingEndsAt?: string;
  transferLimit: number;
  createdAt: string;
}

export interface ScheduledPayment {
  id: number;
  sourceAccountNumber: string;
  targetAccountNumber: string;
  amount: number;
  currency: string;
  description?: string;
  recurrenceType: 'ONCE' | 'WEEKLY' | 'MONTHLY';
  nextExecutionDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'TRANSFER_SENT' | 'TRANSFER_RECEIVED' | 'FRAUD_ALERT' | 'SECURITY_ALERT' | 'SCHEDULED_PAYMENT';
  read: boolean;
  referenceId?: string;
  createdAt: string;
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncoming: number;
  totalOutgoing: number;
  netCashFlow: number;
  totalTransactions: number;
  successRate: number;
}

export interface MonthlyTrend {
  month: string;
  incoming: number;
  outgoing: number;
  net: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
}

export interface DailySpending {
  date: string;
  amount: number;
}

export interface AdminStats {
  totalUsers: number;
  totalAccounts: number;
  totalTransactions: number;
  systemTotalLiquidity: number;
  openFraudAlerts: number;
  totalAuditLogs: number;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  status: 'ACTIVE' | 'LOCKED' | 'SUSPENDED';
  failedAttempts: number;
  lockUntil?: string;
  createdAt: string;
}

export interface FraudAlert {
  id: number;
  transactionId?: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  ruleTriggered: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_FALSE_POSITIVE' | 'RESOLVED_FRAUD';
  reviewedBy?: string;
  reviewedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId?: number;
  username?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  details?: string;
  status: string;
  createdAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
  timestamp: string;
}
