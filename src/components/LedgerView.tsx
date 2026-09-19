import React, { useState } from 'react';
import { Transaction, Partner } from '../types';
import { formatPKR, formatUSD, formatDate } from '../utils/formatters';
import { BookOpen, Search, Filter, RotateCcw, Download, CheckCircle, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { api } from '../api';

interface LedgerViewProps {
  transactions: Transaction[];
  partners: Partner[];
  onRefresh: () => void;
  currentUserRole: string;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  transactions,
  partners,
  onRefresh,
  currentUserRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [reversingTxnId, setReversingTxnId] = useState<number | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.transaction_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.client_name && t.client_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === 'all' || t.transaction_type === selectedType;
    const matchesPartner =
      selectedPartner === 'all' ||
      (selectedPartner === 'company' && !t.partner_id) ||
      t.partner_id === Number(selectedPartner);

    return matchesSearch && matchesType && matchesPartner;
  });

  const handleReverseSubmit = async () => {
    if (!reversingTxnId || !reversalReason.trim()) {
      setErrorMsg('Please state a clear authorized reason for reversing this transaction.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await api.reverseTransaction(reversingTxnId, reversalReason);
      setSuccessMsg('Transaction reversed successfully. An immutable audit trail entry has been logged.');
      setReversingTxnId(null);
      setReversalReason('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reverse transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Txn ID,Date,Type,Description,Amount Original,Currency,Rate,Amount PKR,Partner,Debit Account,Credit Account,Status'];
    const rows = filtered.map(t => [
      t.transaction_number,
      t.date,
      t.transaction_type,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount_original,
      t.currency,
      t.exchange_rate,
      t.amount_pkr,
      t.partner_name || 'Agency General',
      t.debit_account_name || 'N/A',
      t.credit_account_name || 'N/A',
      t.is_reversed ? 'REVERSED' : 'FINALIZED'
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `strykon_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            Central Financial Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete multi-stream audit-backed ledger. Every financial transaction preserves its unique ID, original currency, locked exchange rate, and debit/credit flow.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Ledger (CSV)
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-slate-400 hover:text-white">&times;</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-slate-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="ledger-search-input"
            type="text"
            placeholder="Search by transaction ID, description, or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <select
              id="ledger-type-filter"
              aria-label="Filter by Transaction Type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Types</option>
              <option value="client_payment">Client Payments</option>
              <option value="expense">Operating Expenses</option>
              <option value="payroll">Payroll & Salaries</option>
              <option value="partner_distribution">Partner Distributions</option>
              <option value="loan_receipt">Loan Receipts (Liability)</option>
              <option value="loan_repayment">Loan Repayments</option>
              <option value="account_transfer">Inter-Account Transfers</option>
            </select>
          </div>

          {/* Partner Filter */}
          <select
            id="ledger-partner-filter"
            aria-label="Filter by Partner"
            value={selectedPartner}
            onChange={(e) => setSelectedPartner(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Attributions</option>
            <option value="company">Agency Company Only</option>
            <option value="1">Musaddiq Mustafa</option>
            <option value="2">Arshad Qazi</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Txn #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-3">Partner / Entity</th>
                <th className="py-3 px-3">Accounts (Debit/Credit)</th>
                <th className="py-3 px-3 text-right">Original Amount</th>
                <th className="py-3 px-4 text-right">Amount (PKR)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const isCreditFlow = t.transaction_type === 'client_payment' || t.transaction_type === 'loan_receipt';
                  return (
                    <tr key={t.id} className={`hover:bg-slate-800/30 transition-colors ${t.is_reversed ? 'opacity-50 line-through' : ''}`}>
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">
                        {t.transaction_number}
                      </td>
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          t.transaction_type === 'client_payment' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          t.transaction_type === 'expense' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          t.transaction_type === 'payroll' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          t.transaction_type === 'partner_distribution' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          t.transaction_type === 'loan_receipt' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {t.transaction_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-200 font-medium" title={t.description}>
                        {t.description}
                      </td>
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        {t.partner_id ? (
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            t.partner_id === 1 ? 'bg-blue-900/40 text-blue-300' : 'bg-purple-900/40 text-purple-300'
                          }`}>
                            {t.partner_id === 1 ? 'Musaddiq' : 'Arshad'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Agency Core</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-400">
                        <div><strong className="text-slate-300">Dr:</strong> {t.debit_account_name || '—'}</div>
                        <div><strong className="text-slate-300">Cr:</strong> {t.credit_account_name || '—'}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium">
                        {t.currency === 'USD' ? (
                          <span className="text-emerald-400 font-bold">
                            {formatUSD(t.amount_original)} <span className="text-[10px] text-slate-500">(@{t.exchange_rate})</span>
                          </span>
                        ) : (
                          formatPKR(t.amount_original)
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                        <span className={isCreditFlow ? 'text-emerald-400' : 'text-slate-200'}>
                          {isCreditFlow ? '+' : '-'}{formatPKR(t.amount_pkr)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {t.is_reversed ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-900/40 text-rose-300 font-semibold">
                            Reversed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-900/30 text-emerald-400 font-semibold">
                            Finalized
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {!t.is_reversed && (currentUserRole === 'admin' || currentUserRole === 'accountant') ? (
                          <button
                            onClick={() => setReversingTxnId(t.id)}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded transition-colors"
                            title="Reverse transaction with compensating entry"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reversal Confirmation Modal */}
      {reversingTxnId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Authorized Transaction Reversal</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Per financial integrity rules, finalized records cannot be erased. Reversing will post an atomic compensating ledger entry, readjust account balances, and log an immutable audit entry.
            </p>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Audit Reason for Reversal <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g., Client check bounced, duplicate payment corrected, partner request..."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => { setReversingTxnId(null); setReversalReason(''); }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReverseSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                {isSubmitting ? 'Posting Reversal...' : 'Confirm Reversal'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
