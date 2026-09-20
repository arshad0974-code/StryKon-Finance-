import {
  User, Partner, Account, Client, Contract, Invoice, Payment, Expense,
  Employee, Payroll, Loan, LoanTransaction, PartnerDistribution, Transaction,
  NotificationItem, AuditLog, DashboardData, AcceptanceTestResult
} from './types';
import { handleClientRequest } from './clientStore';

let currentUserRole = 'admin';
let currentUsername = 'admin';

export function setApiAuth(role: string, username: string) {
  currentUserRole = role;
  currentUsername = username;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isStaticHost = typeof window !== 'undefined' && (
    window.location.hostname.endsWith('github.io') ||
    window.location.protocol === 'file:'
  );

  const customApiBase = (import.meta.env.VITE_API_BASE_URL as string) || '';

  // If running in standard full-stack container/server environment or configured with external API URL
  if (!isStaticHost || customApiBase) {
    try {
      const headers = new Headers(options.headers || {});
      headers.set('Content-Type', 'application/json');
      headers.set('x-user-role', currentUserRole);
      headers.set('x-username', currentUsername);

      const targetUrl = customApiBase ? `${customApiBase}/api${endpoint}` : `/api${endpoint}`;
      const response = await fetch(targetUrl, {
        ...options,
        headers,
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return await response.json();
        }
      }
    } catch {
      // Backend unavailable; fallback to client store
    }
  }

  // Client-side execution mode for GitHub Pages and offline static access
  return handleClientRequest<T>(endpoint, options, currentUserRole, currentUsername);
}

export const api = {
  // Health & System
  getHealth: () => request<{ status: string; agency: string }>('/health'),
  getAcceptanceTests: () => request<{ total_tests: number; passed_count: number; all_passed: boolean; tests: AcceptanceTestResult[] }>('/system/run-acceptance-tests'),
  resetBlankDatabase: () => request<{ success: boolean; message: string }>('/system/reset-blank', { method: 'POST' }),

  // History & Previous Data Management
  deleteHistoryItem: (type: string, id: number) => request<{ success: boolean; message: string }>('/history/delete-item', {
    method: 'POST',
    body: JSON.stringify({ type, id }),
  }),
  deleteHistoryMultiple: (items: Array<{ type: string; id: number }>) => request<{ success: boolean; deletedCount: number; message: string }>('/history/delete-multiple', {
    method: 'POST',
    body: JSON.stringify({ items }),
  }),
  deleteAllHistory: () => request<{ success: boolean; message: string }>('/history/delete-all', {
    method: 'POST',
  }),
  deleteTransaction: (id: number) => request<{ success: boolean; message: string }>(`/transactions/${id}`, { method: 'DELETE' }),
  deleteExpense: (id: number) => request<{ success: boolean; message: string }>(`/expenses/${id}`, { method: 'DELETE' }),
  deleteInvoice: (id: number) => request<{ success: boolean; message: string }>(`/invoices/${id}`, { method: 'DELETE' }),
  deletePayment: (id: number) => request<{ success: boolean; message: string }>(`/payments/${id}`, { method: 'DELETE' }),

  // Auth & Users
  getUsers: () => request<User[]>('/auth/users'),
  login: (credentials: { username: string; password: string }) => request<{ success: boolean; user: User; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  resetPassword: (payload: { username: string; newPassword: string }) => request<{ success: boolean; message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Settings
  getSettings: () => request<Record<string, string>>('/settings'),
  updateSettings: (settings: Record<string, any>) => request<{ success: boolean }>('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),

  // Dashboard
  getDashboard: () => request<DashboardData>('/dashboard'),

  // Accounts
  getAccounts: () => request<Account[]>('/accounts'),
  createAccount: (data: Partial<Account>) => request<{ success: boolean; id: number }>('/accounts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  transferFunds: (data: { from_account_id: number; to_account_id: number; amount_pkr: number; reference_note?: string }) => request<{ success: boolean }>('/accounts/transfer', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Partners
  getPartners: () => request<Partner[]>('/partners'),
  getPartnerLedger: (id: number) => request<{ partner: Partner; transactions: Transaction[]; receipts: Payment[]; expensesPaid: Expense[]; distributions: PartnerDistribution[] }>(`/partners/${id}/ledger`),

  // Clients
  getClients: () => request<Client[]>('/clients'),
  createClient: (data: Partial<Client>) => request<{ success: boolean; id: number }>('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Contracts
  getContracts: () => request<Contract[]>('/contracts'),
  createContract: (data: Partial<Contract>) => request<{ success: boolean; id: number }>('/contracts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Invoices
  getInvoices: () => request<Invoice[]>('/invoices'),
  createInvoice: (data: any) => request<{ success: boolean; id: number; invoice_number: string }>('/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Payments
  getPayments: () => request<Payment[]>('/payments'),
  recordPayment: (data: Partial<Payment>) => request<{ success: boolean; id: number; payment_number: string; amount_pkr: number }>('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Expenses
  getExpenses: () => request<Expense[]>('/expenses'),
  recordExpense: (data: Partial<Expense>) => request<{ success: boolean; id: number; expense_number: string; amount_pkr: number }>('/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Employees & Payroll
  getEmployees: () => request<Employee[]>('/employees'),
  createEmployee: (data: Partial<Employee>) => request<{ success: boolean; id: number; employee_code: string }>('/employees', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getPayroll: () => request<Payroll[]>('/payroll'),
  recordPayroll: (data: Partial<Payroll>) => request<{ success: boolean; id: number; payroll_number: string; net_salary: number }>('/payroll', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Partner Distributions
  getPartnerDistributions: () => request<PartnerDistribution[]>('/partner-distributions'),
  recordPartnerDistribution: (data: Partial<PartnerDistribution>) => request<{ success: boolean; id: number; distribution_number: string }>('/partner-distributions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Loans
  getLoans: () => request<{ loans: Loan[]; transactions: LoanTransaction[] }>('/loans'),
  createLoan: (data: Partial<Loan>) => request<{ success: boolean; id: number; loan_number: string }>('/loans', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  repayLoan: (id: number, data: { principal_portion_pkr: number; interest_portion_pkr: number; account_id: number; transaction_date: string; notes?: string }) => request<{ success: boolean }>(`/loans/${id}/repay`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Central Transactions Ledger
  getTransactions: (filters?: { type?: string; partner_id?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.set('type', filters.type);
    if (filters?.partner_id) params.set('partner_id', String(filters.partner_id));
    if (filters?.limit) params.set('limit', String(filters.limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<Transaction[]>(`/transactions${qs}`);
  },
  reverseTransaction: (id: number, reason: string) => request<{ success: boolean }>(`/transactions/${id}/reverse`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),

  // Reports
  getPnlReport: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<{ operating_revenue: number; operating_expenses: number; net_income: number; breakdown: Record<string, number>; exclusions_verified: any }>(`/reports/pnl${qs}`);
  },

  // Notifications
  getNotifications: () => request<NotificationItem[]>('/notifications'),
  markNotificationRead: (id: number) => request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'POST' }),

  // Audit Logs
  getAuditLogs: () => request<AuditLog[]>('/audit-logs'),
};
