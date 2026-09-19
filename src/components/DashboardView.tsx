import React from 'react';
import { DashboardData } from '../types';
import { formatPKR, formatUSD } from '../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  AlertCircle,
  FileCheck,
  CreditCard,
  Building,
  UserCheck,
  Gift,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

interface DashboardViewProps {
  data: DashboardData | null;
  onNavigateTab: (tab: any) => void;
  onOpenPaymentModal: () => void;
  onOpenExpenseModal: () => void;
  onOpenInvoiceModal: () => void;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  onNavigateTab,
  onOpenPaymentModal,
  onOpenExpenseModal,
  onOpenInvoiceModal
}) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mr-3"></div>
        Loading Strykon financial database figures...
      </div>
    );
  }

  // Check if this is an isolated Partner Dashboard response
  if ((data as any).is_partner_dashboard) {
    const pData = data as any;
    const { partner, metrics, recent_payments, recent_distributions, recent_transactions, monthly_activity } = pData;

    return (
      <div className="space-y-6">
        {/* Partner Header Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-xl tracking-wider shadow-sm">
              {partner.name ? partner.name.charAt(0) : 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">{partner.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Partner Portal ({partner.equity_percentage}% Equity)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Account: <strong className="text-slate-200">{partner.personal_account_name}</strong> • Isolated Partner Financial Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="partner-record-payment-btn"
              onClick={onOpenPaymentModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <ArrowDownRight className="w-4 h-4" />
              Record Client Payment
            </button>
            <button
              id="partner-record-expense-btn"
              onClick={onOpenExpenseModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        </div>

        {/* Partner Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Account Balance</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {formatPKR(metrics.account_balance || 0)}
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
              <span>Personal Drawing Account</span>
              <span className="text-emerald-400 font-medium">USD ~{formatUSD((metrics.account_balance || 0) / 280)}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Payments Received</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {formatPKR(metrics.client_payments_received || 0)}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Client receipts managed by you
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Expenses Paid</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {formatPKR(metrics.expenses_paid || 0)}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Disbursed for agency operations
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Drawings & Withdrawals</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {formatPKR(metrics.personal_withdrawals || 0)}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Personal partner drawings
            </div>
          </div>
        </div>

        {/* Secondary Partner Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Gift className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dividends Received</span>
            </div>
            <div className="text-lg font-bold text-white">{formatPKR(metrics.dividends_received || 0)}</div>
            <div className="text-[10px] text-slate-400 mt-1">Net profit distribution share</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Partner Salary</span>
            </div>
            <div className="text-lg font-bold text-white">{formatPKR(metrics.salary_received || 0)}</div>
            <div className="text-[10px] text-slate-400 mt-1">Management compensation</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>Bonuses Received</span>
            </div>
            <div className="text-lg font-bold text-white">{formatPKR(metrics.bonuses_received || 0)}</div>
            <div className="text-[10px] text-slate-400 mt-1">Performance distributions</div>
          </div>
        </div>

        {/* Partner Monthly Activity Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Monthly Cash Flow Activity</h3>
            <span className="text-xs text-slate-400">Your Activity (PKR)</span>
          </div>
          {monthly_activity && monthly_activity.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly_activity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    formatter={(value: any) => [`PKR ${Number(value).toLocaleString()}`, '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="receipts" name="Receipts" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="drawings" name="Drawings" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No monthly activity recorded yet. When you receive payments or log expenses, your monthly trends will appear here.
            </div>
          )}
        </div>

        {/* Recent Activity Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              <span>Recent Client Payments</span>
              <button onClick={() => onNavigateTab('payments')} className="text-xs text-emerald-400 hover:underline">View All &rarr;</button>
            </h3>
            {recent_payments && recent_payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Client</th>
                      <th className="pb-2 text-right">Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recent_payments.map((p: any) => (
                      <tr key={p.id} className="text-slate-300">
                        <td className="py-2">{p.payment_date}</td>
                        <td className="py-2 text-white font-medium">{p.client_name || 'Client'}</td>
                        <td className="py-2 text-right text-emerald-400 font-semibold">{formatPKR(p.amount_pkr)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No payments received yet.
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              <span>Recent Distributions & Drawings</span>
              <button onClick={() => onNavigateTab('partners')} className="text-xs text-emerald-400 hover:underline">View Ledger &rarr;</button>
            </h3>
            {recent_distributions && recent_distributions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2 text-right">Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recent_distributions.map((d: any) => (
                      <tr key={d.id} className="text-slate-300">
                        <td className="py-2">{d.distribution_date}</td>
                        <td className="py-2 capitalize font-medium text-amber-400">{d.distribution_type}</td>
                        <td className="py-2 text-right text-white font-semibold">{formatPKR(d.amount_pkr)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No distributions or drawings recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { kpis, partners_summary, charts } = data;

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Quick Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Strykon Financial Command Center</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Live Relational DB
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time accounting ledger consolidated in PKR with dual USD tracking & separate partner accounting.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="quick-record-payment-btn"
            onClick={onOpenPaymentModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <ArrowDownRight className="w-4 h-4" />
            Record Client Payment
          </button>
          <button
            id="quick-record-expense-btn"
            onClick={onOpenExpenseModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            Add Expense
          </button>
          <button
            id="quick-create-invoice-btn"
            onClick={onOpenInvoiceModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <FileCheck className="w-4 h-4" />
            Issue Invoice
          </button>
        </div>
      </div>

      {/* Main 4 Key Financial Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatPKR(kpis.total_revenue)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Client Receipts (Earned)</span>
            <span className="text-emerald-400 font-medium">USD ~{formatUSD(kpis.total_revenue / 280)}</span>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Operating Expenses</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatPKR(kpis.total_expenses)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Operating & Salaries</span>
            <span className="text-slate-500 text-[11px]">(Excl. Loans & Equity)</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Profit</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${kpis.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatPKR(kpis.net_profit)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Margin: <strong className="text-white">{kpis.profit_margin}%</strong></span>
            {kpis.net_loss > 0 && <span className="text-rose-400">Loss: {formatPKR(kpis.net_loss)}</span>}
          </div>
        </div>

        {/* Cash Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Company Cash Balance</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatPKR(kpis.cash_balance)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>HBL + Meezan + Stripe</span>
            <button onClick={() => onNavigateTab('accounts')} className="text-emerald-400 hover:underline">
              View Accounts &rarr;
            </button>
          </div>
        </div>

      </div>

      {/* Partner Separation Spotlight: Musaddiq Mustafa vs Arshad Qazi */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Partner-Wise Separate Financial Summaries
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict accounting separation: Partner personal drawing accounts are never conflated with company cash.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('partners')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Open Dedicated Partner Ledgers &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Partner 1: Musaddiq Mustafa */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs">
                  MM
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">Musaddiq Mustafa</h3>
                  <span className="text-[10px] text-slate-400">Partner & Co-founder (50% Equity)</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-emerald-400">{formatPKR(partners_summary.musaddiq.partner_balance)}</div>
                <div className="text-[10px] text-slate-400">Personal Ledger Balance</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Receipts Managed</span>
                <span className="font-semibold text-emerald-400">{formatPKR(partners_summary.musaddiq.receipts_managed)}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Expenses Paid</span>
                <span className="font-semibold text-rose-400">{formatPKR(partners_summary.musaddiq.expenses_paid)}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Personal Drawings</span>
                <span className="font-semibold text-amber-400">{formatPKR(partners_summary.musaddiq.drawings)}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Dividends Received</span>
                <span className="font-semibold text-blue-400">{formatPKR(partners_summary.musaddiq.dividends)}</span>
              </div>
            </div>
          </div>

          {/* Partner 2: Arshad Qazi */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-400 text-xs">
                  AQ
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">Arshad Qazi</h3>
                  <span className="text-[10px] text-slate-400">Partner & Co-founder (50% Equity)</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-emerald-400">{formatPKR(partners_summary.arshad.partner_balance)}</div>
                <div className="text-[10px] text-slate-400">Personal Ledger Balance</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Receipts Managed</span>
                <span className="font-semibold text-emerald-400">{formatPKR(partners_summary.arshad.receipts_managed)}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Expenses Paid</span>
                <span className="font-semibold text-rose-400">{formatPKR(partners_summary.arshad.expenses_paid)}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Personal Drawings</span>
                <span className="font-semibold text-amber-400">{formatPKR(partners_summary.arshad.drawings)}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Dividends Received</span>
                <span className="font-semibold text-blue-400">{formatPKR(partners_summary.arshad.dividends)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Secondary Financial Indicators Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Upcoming Receivables</span>
          </div>
          <div className="text-base font-bold text-white">{formatPKR(kpis.upcoming_receivables)}</div>
          <div className="text-[10px] text-slate-400 mt-1">Open client invoices</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-rose-400 text-xs mb-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Overdue Payments</span>
          </div>
          <div className="text-base font-bold text-rose-400">{formatPKR(kpis.overdue_payments)}</div>
          <div className="text-[10px] text-slate-400 mt-1">Past due invoices</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <CreditCard className="w-3.5 h-3.5 text-purple-400" />
            <span>Accounts Payable</span>
          </div>
          <div className="text-base font-bold text-white">{formatPKR(kpis.accounts_payable)}</div>
          <div className="text-[10px] text-slate-400 mt-1">Pending payroll</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Building className="w-3.5 h-3.5 text-amber-400" />
            <span>Outstanding Loans</span>
          </div>
          <div className="text-base font-bold text-amber-400">{formatPKR(kpis.outstanding_loans)}</div>
          <div className="text-[10px] text-slate-400 mt-1">HBL Principal Liability</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Gift className="w-3.5 h-3.5 text-emerald-400" />
            <span>Partner Dividends</span>
          </div>
          <div className="text-base font-bold text-white">{formatPKR(kpis.partner_dividends)}</div>
          <div className="text-[10px] text-slate-400 mt-1">Distributed profit</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
            <span>Partner Withdrawals</span>
          </div>
          <div className="text-base font-bold text-white">{formatPKR(kpis.partner_withdrawals)}</div>
          <div className="text-[10px] text-slate-400 mt-1">Personal drawings</div>
        </div>

      </div>

      {/* Interactive Charts Row 1: Revenue vs Expenses & P&L Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Revenue vs Expenses */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Monthly Revenue vs Operating Expenses</h3>
            <span className="text-xs text-slate-400">Consolidated (PKR)</span>
          </div>
          {charts.revenue_expenses && charts.revenue_expenses.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.revenue_expenses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    formatter={(value: any) => [`PKR ${Number(value).toLocaleString()}`, '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Operating Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
              <p className="font-semibold text-slate-300 mb-1">No monthly transaction data yet</p>
              <p className="text-slate-500 max-w-xs">Record your first client payment or add an operating expense to visualize revenue and expense trends.</p>
            </div>
          )}
        </div>

        {/* Net Profit Trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Monthly Profit & Loss Trend</h3>
            <span className="text-xs text-slate-400">Net Profit (PKR)</span>
          </div>
          {charts.revenue_expenses && charts.revenue_expenses.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.revenue_expenses}>
                  <defs>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    formatter={(value: any) => [`PKR ${Number(value).toLocaleString()}`, 'Net Profit']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#profitGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
              <p className="font-semibold text-slate-300 mb-1">No profit/loss trend data</p>
              <p className="text-slate-500 max-w-xs">As financial events occur in the system, monthly net profit margins will be dynamically charted here.</p>
            </div>
          )}
        </div>

      </div>

      {/* Interactive Charts Row 2: Client Revenue Breakdown & Expense Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Client Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Client Revenue Distribution</h3>
            <button onClick={() => onNavigateTab('clients_invoices')} className="text-xs text-emerald-400 hover:underline">
              Clients & Contracts &rarr;
            </button>
          </div>
          {charts.client_revenue && charts.client_revenue.length > 0 ? (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.client_revenue} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={130} />
                  <Tooltip
                    formatter={(value: any) => [`PKR ${Number(value).toLocaleString()}`, 'Total Paid']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" name="Revenue Paid" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
              <p className="font-semibold text-slate-300 mb-1">No client revenue recorded</p>
              <p className="text-slate-500 max-w-xs">Client collections will be tracked by customer volume once payments are posted.</p>
            </div>
          )}
        </div>

        {/* Expense Categories */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Operating Expense Mix</h3>
            <span className="text-xs text-slate-400">By Category</span>
          </div>
          {charts.expense_categories && charts.expense_categories.length > 0 ? (
            <>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.expense_categories}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {charts.expense_categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`PKR ${Number(value).toLocaleString()}`, 'Amount']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-slate-300">
                {charts.expense_categories.slice(0, 4).map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                    <span className="truncate capitalize">{c.name.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
              <p className="font-semibold text-slate-300 mb-1">No operating expenses</p>
              <p className="text-slate-500 max-w-xs">Operating expense categories will populate as disbursements are logged.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
