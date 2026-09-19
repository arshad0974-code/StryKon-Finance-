import React, { useState } from 'react';
import { Loan, LoanTransaction, Account } from '../types';
import { formatPKR, formatUSD, formatDate } from '../utils/formatters';
import { Building2, Plus, ArrowUpRight, ArrowDownRight, ShieldAlert, Landmark, CheckCircle } from 'lucide-react';
import { api } from '../api';

interface LoansDistributionsViewProps {
  loans: Loan[];
  loanTransactions: LoanTransaction[];
  accounts: Account[];
  onRefresh: () => void;
}

export const LoansDistributionsView: React.FC<LoansDistributionsViewProps> = ({
  loans,
  loanTransactions,
  accounts,
  onRefresh
}) => {
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [activeLoanId, setActiveLoanId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add loan state
  const [lenderName, setLenderName] = useState('');
  const [loanType, setLoanType] = useState('bank_term_loan');
  const [principalAmount, setPrincipalAmount] = useState(1000000);
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR');
  const [exchangeRate, setExchangeRate] = useState(280);
  const [interestRate, setInterestRate] = useState(12.5);
  const [termMonths, setTermMonths] = useState(24);
  const [loanAccountId, setLoanAccountId] = useState<number>(accounts[0]?.id || 1);

  // Repay loan state
  const [repayPrincipal, setRepayPrincipal] = useState(200000);
  const [repayInterest, setRepayInterest] = useState(25000);
  const [repayAccountId, setRepayAccountId] = useState<number>(accounts[0]?.id || 1);
  const [repayDate, setRepayDate] = useState(new Date().toISOString().split('T')[0]);
  const [repayNotes, setRepayNotes] = useState('');

  const selectedLoan = loans.find(l => l.id === activeLoanId) || loans[0];

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lenderName || principalAmount <= 0) {
      setErrorMsg('Lender name and positive principal are required.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.createLoan({
        lender_name: lenderName,
        loan_type: loanType,
        principal_amount: Number(principalAmount),
        currency,
        exchange_rate: currency === 'USD' ? Number(exchangeRate) : 1.0,
        interest_rate: Number(interestRate),
        term_months: Number(termMonths),
        start_date: new Date().toISOString().split('T')[0],
        account_id: loanAccountId
      });
      setSuccessMsg(`Loan ${res.loan_number} booked as liability! Funds credited to company account.`);
      setShowLoanModal(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRepayLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLoanId || (repayPrincipal <= 0 && repayInterest <= 0)) {
      setErrorMsg('Valid principal or interest portion required.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await api.repayLoan(activeLoanId, {
        principal_portion_pkr: Number(repayPrincipal),
        interest_portion_pkr: Number(repayInterest),
        account_id: repayAccountId,
        transaction_date: repayDate,
        notes: repayNotes
      });
      setSuccessMsg('Loan repayment logged! Principal deducted from liabilities, interest booked to operating expense.');
      setShowRepayModal(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to repay loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            Company Financing & Loan Liabilities
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Financial Integrity Enforced: Loan receipts are booked strictly as Balance Sheet liabilities (never as revenue). Repayments distinguish liability reductions from interest charges.
          </p>
        </div>

        <button
          id="add-loan-btn"
          onClick={() => setShowLoanModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Acquire New Financing
        </button>
      </div>

      {/* Messages */}
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

      {/* Loans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loans.map((l) => (
          <div key={l.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {l.loan_number}
                </span>
                <h3 className="text-base font-bold text-white mt-2">{l.lender_name}</h3>
                <p className="text-xs text-slate-400 capitalize">{l.loan_type.replace('_', ' ')} • {l.term_months} Months Term</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                l.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
              }`}>
                {l.status}
              </span>
            </div>

            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Original Principal:</span>
                <span className="font-mono font-semibold text-white">{formatPKR(l.principal_pkr)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Interest Rate:</span>
                <span className="font-mono text-amber-400">{l.interest_rate}% APR</span>
              </div>
              <div className="flex justify-between text-slate-300 border-t border-slate-700/60 pt-2 font-bold">
                <span className="text-slate-400">Remaining Balance (Liability):</span>
                <span className="font-mono text-white text-sm">{formatPKR(l.remaining_principal_pkr)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                Acquired: {formatDate(l.start_date)}
              </span>
              {l.remaining_principal_pkr > 0 && (
                <button
                  onClick={() => {
                    setActiveLoanId(l.id);
                    setRepayPrincipal(Math.min(200000, l.remaining_principal_pkr));
                    setShowRepayModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
                >
                  Record Repayment
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Loan Transactions Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Financing Transactions & Principal Repayments</h3>
          <span className="text-xs text-slate-400">{loanTransactions.length} recorded entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Lender / Facility</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3 text-right">Principal Portion</th>
                <th className="py-3 px-3 text-right">Interest Portion</th>
                <th className="py-3 px-4 text-right">Total Cash Flow (PKR)</th>
                <th className="py-3 px-3">Bank Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loanTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-slate-400">
                    {formatDate(tx.transaction_date)}
                  </td>
                  <td className="py-3 px-3 font-semibold text-white">
                    {tx.lender_name}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      tx.transaction_type === 'receipt' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {tx.transaction_type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium">
                    {formatPKR(tx.principal_portion_pkr)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-rose-400 font-medium">
                    {tx.interest_portion_pkr > 0 ? formatPKR(tx.interest_portion_pkr) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">
                    {tx.transaction_type === 'receipt' ? '+' : '-'}{formatPKR(tx.total_pkr)}
                  </td>
                  <td className="py-3 px-3 text-slate-300 text-[11px]">
                    {tx.account_name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD LOAN MODAL */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              Acquire Company Financing / Loan
            </h3>
            <form onSubmit={handleCreateLoan} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Lender / Financial Institution *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Habib Bank Limited (HBL) SME Facility"
                  value={lenderName}
                  onChange={(e) => setLenderName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Principal Amount *</label>
                  <input
                    type="number"
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Interest Rate (% APR)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Deposit Principal Into Account *</label>
                <select
                  value={loanAccountId}
                  onChange={(e) => setLoanAccountId(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                </select>
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-xl text-[11px] text-amber-300">
                <strong>Financial Integrity Check:</strong> The loan principal will be deposited to your bank account and credited as a balance sheet liability. It will NEVER be included in operating revenues.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowLoanModal(false)} className="px-4 py-2 text-slate-400">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 font-bold text-white rounded-xl">
                  {isSubmitting ? 'Booking...' : 'Book Loan Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPAY LOAN MODAL */}
      {showRepayModal && selectedLoan && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-400" />
              Repay Loan — {selectedLoan.lender_name}
            </h3>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-xs flex justify-between">
              <span className="text-slate-400">Remaining Balance:</span>
              <span className="font-mono font-bold text-amber-400">{formatPKR(selectedLoan.remaining_principal_pkr)}</span>
            </div>

            <form onSubmit={handleRepayLoan} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Principal Reduction (PKR)</label>
                  <input
                    type="number"
                    value={repayPrincipal}
                    onChange={(e) => setRepayPrincipal(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Reduces Balance Sheet liability</span>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Interest Portion (PKR)</label>
                  <input
                    type="number"
                    value={repayInterest}
                    onChange={(e) => setRepayInterest(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Operating expense (Finance fee)</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Pay From Account *</label>
                <select
                  value={repayAccountId}
                  onChange={(e) => setRepayAccountId(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.currency}) - Bal: {formatPKR(a.current_balance)}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowRepayModal(false)} className="px-4 py-2 text-slate-400">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 font-bold text-white rounded-xl">
                  {isSubmitting ? 'Processing...' : 'Confirm Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
