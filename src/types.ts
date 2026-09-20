export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: 'admin' | 'partner';
  partner_id?: number | null;
  created_at?: string;
}

export interface Partner {
  id: number;
  name: string;
  email: string;
  phone: string;
  equity_percentage: number;
  initial_capital: number;
  total_receipts_managed?: number;
  total_expenses_paid?: number;
  total_drawings?: number;
  total_dividends?: number;
  total_salaries?: number;
  account_balance?: number;
  personal_account_name?: string;
}

export interface Account {
  id: number;
  name: string;
  account_number: string;
  account_type: 'bank' | 'cash' | 'partner_personal' | 'stripe_usd';
  partner_id?: number | null;
  partner_name?: string | null;
  currency: 'PKR' | 'USD';
  current_balance: number;
  is_active: number;
  notes?: string;
}

export interface Client {
  id: number;
  name: string;
  company_name: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  status: 'active' | 'inactive';
  total_billed_pkr?: number;
  total_paid_pkr?: number;
  outstanding_balance_pkr?: number;
  contract_count?: number;
}

export interface Contract {
  id: number;
  client_id: number;
  client_name?: string;
  contact_person?: string;
  title: string;
  contract_number: string;
  contract_value: number;
  currency: 'PKR' | 'USD';
  exchange_rate: number;
  contract_value_pkr: number;
  start_date: string;
  end_date?: string;
  billing_cycle: 'monthly' | 'milestone' | 'one_time';
  status: 'active' | 'completed' | 'terminated';
  notes?: string;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  client_id: number;
  client_name?: string;
  client_email?: string;
  contract_id?: number | null;
  contract_title?: string | null;
  issue_date: string;
  due_date: string;
  currency: 'PKR' | 'USD';
  exchange_rate: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  total_amount_pkr: number;
  paid_amount: number;
  balance_due: number;
  status: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue';
  notes?: string;
  items?: InvoiceItem[];
}

export interface Payment {
  id: number;
  payment_number: string;
  client_id: number;
  client_name?: string;
  invoice_id?: number | null;
  invoice_number?: string | null;
  account_id: number;
  account_name?: string;
  partner_id?: number | null;
  partner_name?: string | null;
  payment_date: string;
  currency: 'PKR' | 'USD';
  exchange_rate: number;
  amount_original: number;
  amount_pkr: number;
  payment_method: string;
  reference_note?: string;
  is_advance: number;
}

export interface Expense {
  id: number;
  expense_number: string;
  title: string;
  category: string;
  amount_original: number;
  currency: 'PKR' | 'USD';
  exchange_rate: number;
  amount_pkr: number;
  account_id: number;
  account_name?: string;
  paid_by_partner_id?: number | null;
  partner_name?: string | null;
  vendor?: string;
  expense_date: string;
  is_reimbursable: number;
  receipt_url?: string;
  notes?: string;
  status: string;
}

export interface Employee {
  id: number;
  employee_code: string;
  full_name: string;
  email?: string;
  phone?: string;
  designation: string;
  department: string;
  base_salary_pkr: number;
  joining_date: string;
  status: 'active' | 'inactive';
  bank_account_details?: string;
  total_paid_salaries?: number;
}

export interface Payroll {
  id: number;
  payroll_number: string;
  employee_id: number;
  employee_name?: string;
  designation?: string;
  department?: string;
  month_year: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  net_salary: number;
  account_id?: number | null;
  account_name?: string | null;
  payment_date?: string | null;
  status: 'pending' | 'paid';
  notes?: string;
}

export interface Loan {
  id: number;
  loan_number: string;
  lender_name: string;
  loan_type: string;
  principal_amount: number;
  currency: 'PKR' | 'USD';
  exchange_rate: number;
  principal_pkr: number;
  interest_rate: number;
  term_months: number;
  start_date: string;
  remaining_principal_pkr: number;
  status: 'active' | 'paid_off';
  account_id?: number;
  account_name?: string;
  transaction_count?: number;
}

export interface LoanTransaction {
  id: number;
  loan_id: number;
  loan_number?: string;
  lender_name?: string;
  transaction_type: 'receipt' | 'repayment';
  principal_portion_pkr: number;
  interest_portion_pkr: number;
  total_pkr: number;
  account_id: number;
  account_name?: string;
  transaction_date: string;
  notes?: string;
}

export interface PartnerDistribution {
  id: number;
  distribution_number: string;
  partner_id: number;
  partner_name?: string;
  distribution_type: 'salary' | 'bonus' | 'dividend' | 'gift' | 'withdrawal';
  amount_pkr: number;
  currency: 'PKR' | 'USD';
  exchange_rate: number;
  amount_original: number;
  account_id: number;
  account_name?: string;
  distribution_date: string;
  approved_by?: string;
  status: string;
  notes?: string;
}

export interface Transaction {
  id: number;
  transaction_number: string;
  date: string;
  transaction_type: 'client_payment' | 'expense' | 'payroll' | 'bonus' | 'partner_distribution' | 'loan_receipt' | 'loan_repayment' | 'account_transfer' | 'capital_contribution';
  debit_account_id?: number | null;
  debit_account_name?: string | null;
  credit_account_id?: number | null;
  credit_account_name?: string | null;
  amount_original: number;
  currency: 'PKR' | 'USD';
  exchange_rate: number;
  amount_pkr: number;
  partner_id?: number | null;
  partner_name?: string | null;
  client_id?: number | null;
  client_name?: string | null;
  invoice_id?: number | null;
  reference_type?: string;
  reference_id?: number;
  description: string;
  is_finalized: number;
  is_reversed: number;
  created_by: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'warning' | 'overdue' | 'alert' | 'info' | 'success';
  is_read: number;
  link_tab?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  entity_type: string;
  entity_id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'REVERSE' | 'TRANSFER';
  changed_by: string;
  old_values?: string;
  new_values?: string;
  reason?: string;
  timestamp: string;
}

export interface DashboardData {
  kpis: {
    total_revenue: number;
    total_received_payments: number;
    total_expenses: number;
    net_profit: number;
    net_loss: number;
    profit_margin: number;
    cash_balance: number;
    upcoming_receivables: number;
    overdue_payments: number;
    accounts_payable: number;
    employee_salaries: number;
    employee_bonuses: number;
    partner_salaries: number;
    partner_bonuses: number;
    partner_dividends: number;
    partner_withdrawals: number;
    outstanding_loans: number;
  };
  partners_summary: {
    musaddiq: {
      id: number;
      name: string;
      receipts_managed: number;
      expenses_paid: number;
      drawings: number;
      dividends: number;
      partner_balance: number;
    };
    arshad: {
      id: number;
      name: string;
      receipts_managed: number;
      expenses_paid: number;
      drawings: number;
      dividends: number;
      partner_balance: number;
    };
  };
  charts: {
    revenue_expenses: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
    client_revenue: Array<{ name: string; value: number }>;
    expense_categories: Array<{ name: string; value: number }>;
    receivables_aging: Array<{ bracket: string; amount: number }>;
    cash_flow: Array<{ month: string; operating: number; financing: number; net: number }>;
  };
}

export interface AcceptanceTestResult {
  id: number;
  title: string;
  description: string;
  passed: boolean;
  detail: string;
}

export interface HistoryRecord {
  id: string; // unique key, e.g. "txn-12", "inv-4", "exp-7"
  rawId: number;
  type: 'transaction' | 'invoice' | 'expense' | 'payment' | 'distribution' | 'loan';
  typeLabel: string;
  title: string;
  subtitle?: string;
  date: string;
  amount: number;
  currency: string;
  category?: string;
  status?: string;
  details?: string;
}
