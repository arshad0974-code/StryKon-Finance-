import React, { useState, useEffect } from 'react';
import {
  User, Partner, Account, Client, Contract, Invoice, Payment, Expense,
  Employee, Payroll, Loan, LoanTransaction, PartnerDistribution, Transaction,
  NotificationItem, DashboardData
} from './types';
import { api, setApiAuth } from './api';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { LedgerView } from './components/LedgerView';
import { ClientsInvoicesView } from './components/ClientsInvoicesView';
import { PaymentsView } from './components/PaymentsView';
import { ExpensesView } from './components/ExpensesView';
import { PartnersView } from './components/PartnersView';
import { PayrollView } from './components/PayrollView';
import { LoansDistributionsView } from './components/LoansDistributionsView';
import { AccountsView } from './components/AccountsView';
import { ReportsView } from './components/ReportsView';
import { PreviousDataView } from './components/PreviousDataView';
import { AcceptanceChecklistView } from './components/AcceptanceChecklistView';
import { SettingsView } from './components/SettingsView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [partnerFilter, setPartnerFilter] = useState<number | null>(null);

  // Core Data
  const [currentUser, setCurrentUser] = useState<User>({
    id: 1,
    username: 'admin',
    full_name: 'Super Admin',
    email: 'admin@strykon.com',
    role: 'admin'
  });
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanTransactions, setLoanTransactions] = useState<LoanTransaction[]>([]);
  const [distributions, setDistributions] = useState<PartnerDistribution[]>([]);

  // Navigation payload for payment modal
  const [preselectedInvoice, setPreselectedInvoice] = useState<Invoice | null>(null);

  const loadAllData = async () => {
    setIsRefreshing(true);
    try {
      const [
        dashRes,
        usersRes,
        notifRes,
        txnRes,
        partRes,
        accRes,
        cliRes,
        conRes,
        invRes,
        payRes,
        expRes,
        empRes,
        prlRes,
        loanRes,
        distRes
      ] = await Promise.all([
        api.getDashboard(),
        api.getUsers(),
        api.getNotifications(),
        api.getTransactions(),
        api.getPartners(),
        api.getAccounts(),
        api.getClients(),
        api.getContracts(),
        api.getInvoices(),
        api.getPayments(),
        api.getExpenses(),
        api.getEmployees(),
        api.getPayroll(),
        api.getLoans(),
        api.getPartnerDistributions()
      ]);

      setDashboardData(dashRes);
      setUsers(usersRes);
      setNotifications(notifRes);
      setTransactions(txnRes);
      setPartners(partRes);
      setAccounts(accRes);
      setClients(cliRes);
      setContracts(conRes);
      setInvoices(invRes);
      setPayments(payRes);
      setExpenses(expRes);
      setEmployees(empRes);
      setPayroll(prlRes);
      setLoans(loanRes.loans);
      setLoanTransactions(loanRes.transactions);
      setDistributions(distRes);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setApiAuth(currentUser.role, currentUser.username);
    loadAllData();
  }, []);

  useEffect(() => {
    // If a partner tries to access admin-only tabs, redirect to dashboard
    if (currentUser.role === 'partner' && (currentTab === 'payroll' || currentTab === 'settings')) {
      setCurrentTab('dashboard');
    }
  }, [currentUser.role, currentTab]);

  const handleNotificationRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvoicePaymentTrigger = (invoice: Invoice) => {
    setPreselectedInvoice(invoice);
    setCurrentTab('payments');
  };

  const overdueInvoicesCount = invoices.filter(i => i.status === 'overdue').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        users={users}
        onUserChange={(user) => {
          setCurrentUser(user);
          loadAllData();
        }}
        notifications={notifications}
        onNotificationRead={handleNotificationRead}
        onRefresh={loadAllData}
        selectedPartnerFilter={partnerFilter}
        onPartnerFilterChange={(pId) => {
          setPartnerFilter(pId);
          if (pId !== null) {
            setCurrentTab('partners');
          }
        }}
        isRefreshing={isRefreshing}
      />

      {/* Main Tab Navigation */}
      <Navigation
        currentTab={currentTab}
        onTabChange={(tab) => {
          setPreselectedInvoice(null);
          setCurrentTab(tab);
        }}
        overdueCount={overdueInvoicesCount}
        userRole={currentUser.role}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {currentTab === 'dashboard' && (
          <DashboardView
            data={dashboardData}
            onNavigateTab={setCurrentTab}
            onOpenPaymentModal={() => setCurrentTab('payments')}
            onOpenExpenseModal={() => setCurrentTab('expenses')}
            onOpenInvoiceModal={() => setCurrentTab('clients_invoices')}
          />
        )}

        {currentTab === 'ledger' && (
          <LedgerView
            transactions={transactions}
            partners={partners}
            onRefresh={loadAllData}
            currentUserRole={currentUser.role}
          />
        )}

        {currentTab === 'clients_invoices' && (
          <ClientsInvoicesView
            clients={clients}
            contracts={contracts}
            invoices={invoices}
            accounts={accounts}
            partners={partners}
            onRefresh={loadAllData}
            onOpenPaymentForInvoice={handleInvoicePaymentTrigger}
          />
        )}

        {currentTab === 'payments' && (
          <PaymentsView
            payments={payments}
            invoices={invoices}
            clients={clients}
            accounts={accounts}
            partners={partners}
            onRefresh={loadAllData}
            initialInvoice={preselectedInvoice}
            onClearInitialInvoice={() => setPreselectedInvoice(null)}
          />
        )}

        {currentTab === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            accounts={accounts}
            partners={partners}
            onRefresh={loadAllData}
          />
        )}

        {currentTab === 'accounts' && (
          <AccountsView
            accounts={accounts}
            onRefresh={loadAllData}
          />
        )}

        {currentTab === 'partners' && (
          <PartnersView
            partners={partners}
            accounts={accounts}
            distributions={distributions}
            onRefresh={loadAllData}
          />
        )}

        {currentTab === 'payroll' && (
          <PayrollView
            employees={employees}
            payroll={payroll}
            accounts={accounts}
            onRefresh={loadAllData}
          />
        )}

        {currentTab === 'loans_distributions' && (
          <LoansDistributionsView
            loans={loans}
            loanTransactions={loanTransactions}
            accounts={accounts}
            onRefresh={loadAllData}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView />
        )}

        {currentTab === 'history' && (
          <PreviousDataView
            transactions={transactions}
            invoices={invoices}
            expenses={expenses}
            payments={payments}
            distributions={distributions}
            loans={loans}
            accounts={accounts}
            partners={partners}
            onRefresh={loadAllData}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'checklist' && (
          <AcceptanceChecklistView />
        )}

        {currentTab === 'settings' && (
          <SettingsView />
        )}

      </main>

      {/* App Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 text-slate-500 text-xs py-4 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Strykon Digital Marketing Agency • Financial Operating System</span>
          <span className="text-[11px] text-slate-400">
            Compliant Relational Accounting Engine • Base Currency: PKR • Dual USD Conversion
          </span>
        </div>
      </footer>

    </div>
  );
}
