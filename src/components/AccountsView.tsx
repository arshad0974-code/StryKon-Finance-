import React, { useState, useEffect } from 'react';
import { Account } from '../types';
import { formatPKR, formatUSD } from '../utils/formatters';
import { Landmark, ArrowRightLeft, Plus, CheckCircle, ShieldCheck, CreditCard, Wallet, UserCheck } from 'lucide-react';
import { api } from '../api';

interface AccountsViewProps {
  accounts: Account[];
  onRefresh: () => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ accounts, onRefresh }) => {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [fromAccountId, setFromAccountId] = useState<number>(accounts[0]?.id || 1);
  const [toAccountId, setToAccountId] = useState<number>(accounts[1]?.id || 2);

  useEffect(() => {
    if (accounts.length > 0) {
      if (!accounts.some(a => a.id === fromAccountId)) {
        setFromAccountId(accounts[0].id);
      }
      if (!accounts.some(a => a.id === toAccountId)) {
        setToAccountId(accounts[1]?.id || accounts[0].id);
      }
    }
  }, [accounts, fromAccountId, toAccountId]);
  const [transferAmount, setTransferAmount] = useState<number>(50000);
  const [transferNote, setTransferNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New account state
  const [accName, setAccName] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [accType, setAccType] = useState<'bank' | 'cash' | 'stripe_usd'>('bank');
  const [accCurrency, setAccCurrency] = useState<'PKR' | 'USD'>('PKR');
  const [accBalance, setAccBalance] = useState(0);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccountId === toAccountId) {
      setErrorMsg('Source and Destination accounts must be different.');
      return;
    }
    if (transferAmount <= 0) {
      setErrorMsg('Please specify a positive transfer amount.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await api.transferFunds({
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount_pkr: Number(transferAmount),
        reference_note: transferNote
      });
      setSuccessMsg('Transfer processed successfully. Account balances updated without impacting P&L.');
      setShowTransferModal(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName || !accNumber) {
      setErrorMsg('Account Name and Number are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createAccount({
        name: accName,
        account_number: accNumber,
        account_type: accType,
        currency: accCurrency,
        current_balance: Number(accBalance)
      });
      setSuccessMsg('Account created successfully.');
      setShowAddAccountModal(false);
      setAccName('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAgencyCash = accounts
    .filter(a => a.account_type !== 'partner_personal')
    .reduce((sum, a) => sum + (a.currency === 'USD' ? a.current_balance * 280 : a.current_balance), 0);

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-400" />
            Financial Accounts & Liquidity
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Agency corporate bank accounts, Stripe USD processor, petty cash, and separate partner ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="transfer-funds-btn"
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Transfer Funds
          </button>
          <button
            id="add-account-btn"
            onClick={() => setShowAddAccountModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>
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

      {/* Total Liquidity Callout */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Company Cash & Bank Balances</span>
            <div className="text-xl font-bold text-white font-mono">{formatPKR(totalAgencyCash)}</div>
          </div>
        </div>
        <div className="text-xs text-slate-400 text-right hidden sm:block">
          <span>Includes HBL, Meezan, Cash & Stripe USD.</span>
          <span className="block text-[11px] text-slate-500">(Partner personal accounts tracked separately)</span>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const isPartner = acc.account_type === 'partner_personal';
          return (
            <div
              key={acc.id}
              className={`p-5 rounded-2xl border shadow-sm space-y-3 ${
                isPartner
                  ? 'bg-slate-900/60 border-slate-800'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${
                    acc.account_type === 'stripe_usd' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    acc.account_type === 'cash' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    isPartner ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {isPartner ? <UserCheck className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{acc.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">{acc.account_number}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                  {acc.currency}
                </span>
              </div>

              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <div className="text-[11px] text-slate-400">Current Balance:</div>
                <div className="text-lg font-bold text-white font-mono mt-0.5">
                  {acc.currency === 'USD' ? (
                    <div>
                      <span className="text-emerald-400">{formatUSD(acc.current_balance)}</span>
                      <span className="text-xs text-slate-400 block font-normal">(PKR {Math.round(acc.current_balance * 280).toLocaleString()})</span>
                    </div>
                  ) : (
                    formatPKR(acc.current_balance)
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="capitalize">{acc.account_type.replace('_', ' ')}</span>
                {isPartner && <span className="text-purple-400 font-semibold">Partner Drawing Account</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
              Inter-Account Fund Transfer
            </h3>
            <form onSubmit={handleTransfer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Transfer From *</label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({formatPKR(a.current_balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Transfer To *</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({formatPKR(a.current_balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Amount (PKR) *</label>
                <input
                  type="number"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Transfer Purpose / Reference</label>
                <input
                  type="text"
                  placeholder="e.g., Transfer to petty cash for office operations"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-[11px] text-emerald-300">
                <strong>Accounting Rule:</strong> Internal transfers simply reallocate assets across accounts. They are never recorded as revenue or expense.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowTransferModal(false)} className="px-4 py-2 text-slate-400">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-xl">
                  {isSubmitting ? 'Transferring...' : 'Execute Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ACCOUNT MODAL */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add Bank or Cash Account</h3>
            <form onSubmit={handleAddAccount} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Standard Chartered PKR"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Account / IBAN Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="PK36SCBL..."
                    value={accNumber}
                    onChange={(e) => setAccNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Type</label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="bank">Commercial Bank</option>
                    <option value="cash">Petty Cash</option>
                    <option value="stripe_usd">Merchant Processor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Currency</label>
                  <select
                    value={accCurrency}
                    onChange={(e) => setAccCurrency(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="PKR">PKR (Base)</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Initial Balance</label>
                  <input
                    type="number"
                    value={accBalance}
                    onChange={(e) => setAccBalance(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowAddAccountModal(false)} className="px-4 py-2 text-slate-400">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-xl">
                  {isSubmitting ? 'Saving...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
