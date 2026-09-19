import React, { useState, useEffect } from 'react';
import { Partner, PartnerDistribution, Account } from '../types';
import { formatPKR, formatUSD, formatDate } from '../utils/formatters';
import { UserCheck2, DollarSign, Plus, ArrowUpRight, ArrowDownRight, Gift, Briefcase, ShieldAlert, Award } from 'lucide-react';
import { api } from '../api';

interface PartnersViewProps {
  partners: Partner[];
  accounts: Account[];
  distributions: PartnerDistribution[];
  onRefresh: () => void;
}

export const PartnersView: React.FC<PartnersViewProps> = ({
  partners,
  accounts,
  distributions,
  onRefresh
}) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<number>(partners[0]?.id || 1);

  useEffect(() => {
    if (partners.length > 0 && !partners.some(p => p.id === selectedPartnerId)) {
      setSelectedPartnerId(partners[0].id);
      setDistPartnerId(partners[0].id);
    }
  }, [partners, selectedPartnerId]);
  const [showDistModal, setShowDistModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Distribution form
  const [distPartnerId, setDistPartnerId] = useState<number>(selectedPartnerId);
  const [distType, setDistType] = useState<'salary' | 'bonus' | 'dividend' | 'gift' | 'withdrawal'>('dividend');
  const [distAmountOriginal, setDistAmountOriginal] = useState<number>(50000);
  const [distCurrency, setDistCurrency] = useState<'PKR' | 'USD'>('PKR');
  const [distExchangeRate, setDistExchangeRate] = useState<number>(280);
  const [distAccountId, setDistAccountId] = useState<number>(accounts[0]?.id || 1);
  const [distDate, setDistDate] = useState(new Date().toISOString().split('T')[0]);
  const [distNotes, setDistNotes] = useState('');

  const currentPartner = partners.find(p => p.id === selectedPartnerId) || partners[0];
  const partnerDistributions = distributions.filter(d => d.partner_id === selectedPartnerId);

  const distAmountPkr = distCurrency === 'USD' ? Math.round(distAmountOriginal * distExchangeRate) : distAmountOriginal;

  const handleRecordDistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distPartnerId || !distAccountId || distAmountOriginal <= 0) {
      setErrorMsg('Partner, payout account, and positive amount are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.recordPartnerDistribution({
        partner_id: distPartnerId,
        distribution_type: distType,
        amount_original: Number(distAmountOriginal),
        currency: distCurrency,
        exchange_rate: distCurrency === 'USD' ? Number(distExchangeRate) : 1.0,
        amount_pkr: distAmountPkr,
        account_id: distAccountId,
        distribution_date: distDate,
        approved_by: 'Partners Board (Mutual Consent)',
        notes: distNotes
      });
      setSuccessMsg(`Partner Distribution ${res.distribution_number} recorded successfully!`);
      setShowDistModal(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record distribution');
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
            <UserCheck2 className="w-5 h-5 text-emerald-400" />
            Partner Ledgers & Equity Accounting
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Independent ledger separation for Musaddiq Mustafa and Arshad Qazi. Partner withdrawals and profit distributions are strictly isolated from operating expenses.
          </p>
        </div>

        <button
          id="record-distribution-btn"
          onClick={() => {
            setDistPartnerId(selectedPartnerId);
            setShowDistModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Record Distribution / Drawing
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

      {/* Partner Switcher Tabs */}
      <div className="flex items-center gap-3">
        {partners.map(p => (
          <button
            key={p.id}
            id={`partner-tab-${p.id}`}
            onClick={() => setSelectedPartnerId(p.id)}
            className={`flex-1 p-4 rounded-2xl border text-left transition-all ${
              selectedPartnerId === p.id
                ? 'bg-slate-800 border-emerald-500/60 shadow-lg'
                : 'bg-slate-900 border-slate-800 hover:bg-slate-850 opacity-80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  p.id === 1 ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                }`}>
                  {p.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{p.name}</h3>
                  <p className="text-xs text-slate-400">{p.equity_percentage}% Equity • {p.email}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Personal Balance</div>
                <div className="text-sm font-bold text-emerald-400">{formatPKR(p.account_balance)}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Partner Deep Dive */}
      {currentPartner && (
        <div className="space-y-4">
          
          {/* Partner KPI Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <div className="text-xs text-slate-400 mb-1">Receipts Managed</div>
              <div className="text-base font-bold text-emerald-400">{formatPKR(currentPartner.total_receipts_managed)}</div>
              <div className="text-[10px] text-slate-500 mt-1">Client receipts received</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <div className="text-xs text-slate-400 mb-1">Expenses Paid</div>
              <div className="text-base font-bold text-rose-400">{formatPKR(currentPartner.total_expenses_paid)}</div>
              <div className="text-[10px] text-slate-500 mt-1">Funded out of pocket</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <div className="text-xs text-slate-400 mb-1">Personal Drawings</div>
              <div className="text-base font-bold text-amber-400">{formatPKR(currentPartner.total_drawings)}</div>
              <div className="text-[10px] text-slate-500 mt-1">Capital withdrawals</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <div className="text-xs text-slate-400 mb-1">Dividends Distributed</div>
              <div className="text-base font-bold text-blue-400">{formatPKR(currentPartner.total_dividends)}</div>
              <div className="text-[10px] text-slate-500 mt-1">Profit share payouts</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 col-span-2 sm:col-span-1">
              <div className="text-xs text-slate-400 mb-1">Executive Salaries</div>
              <div className="text-base font-bold text-purple-400">{formatPKR(currentPartner.total_salaries)}</div>
              <div className="text-[10px] text-slate-500 mt-1">Fixed management pay</div>
            </div>
          </div>

          {/* Partner Distributions History */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Distributions & Withdrawals History ({currentPartner.name})</h3>
                <span className="text-[11px] text-slate-400">Equity distributions, dividends, and personal drawings</span>
              </div>
              <button
                onClick={() => {
                  setDistPartnerId(currentPartner.id);
                  setShowDistModal(true);
                }}
                className="text-xs text-emerald-400 hover:underline font-semibold"
              >
                + Record Entry
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Ref #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Account Source</th>
                    <th className="py-3 px-4">Approval / Notes</th>
                    <th className="py-3 px-4 text-right">Amount (PKR)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {partnerDistributions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No distributions or withdrawals recorded for {currentPartner.name} yet.
                      </td>
                    </tr>
                  ) : (
                    partnerDistributions.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-300">
                          {d.distribution_number}
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {formatDate(d.distribution_date)}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            d.distribution_type === 'dividend' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            d.distribution_type === 'withdrawal' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            d.distribution_type === 'salary' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {d.distribution_type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {d.account_name}
                        </td>
                        <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                          {d.notes || d.approved_by || '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white">
                          {formatPKR(d.amount_pkr)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold">
                            Disbursed
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* RECORD DISTRIBUTION MODAL */}
      {showDistModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-400" />
                Record Partner Distribution / Drawing
              </h3>
              <button onClick={() => setShowDistModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleRecordDistribution} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Partner *</label>
                  <select
                    value={distPartnerId}
                    onChange={(e) => setDistPartnerId(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Distribution Type *</label>
                  <select
                    value={distType}
                    onChange={(e) => setDistType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="dividend">Profit Dividend (Post-Tax)</option>
                    <option value="withdrawal">Personal Capital Withdrawal (Drawing)</option>
                    <option value="salary">Executive Partner Salary</option>
                    <option value="bonus">Partner Performance Bonus</option>
                    <option value="gift">Company Gift / Token</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Currency</label>
                  <select
                    value={distCurrency}
                    onChange={(e) => setDistCurrency(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="PKR">PKR (Rs)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount</label>
                  <input
                    type="number"
                    required
                    value={distAmountOriginal}
                    onChange={(e) => setDistAmountOriginal(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Exchange Rate</label>
                  <input
                    type="number"
                    value={distExchangeRate}
                    disabled={distCurrency === 'PKR'}
                    onChange={(e) => setDistExchangeRate(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white disabled:opacity-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Disburse From Bank Account *</label>
                <select
                  value={distAccountId}
                  onChange={(e) => setDistAccountId(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency}) - Available: {formatPKR(a.current_balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    value={distDate}
                    onChange={(e) => setDistDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Resolution / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g., Q3 Dividend distribution resolution"
                    value={distNotes}
                    onChange={(e) => setDistNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              {/* Financial Rule Notice */}
              <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl text-[11px] text-blue-300 space-y-1">
                <strong>Accounting Rule:</strong> Dividends and personal withdrawals are equity distributions and are strictly excluded from Operating Expenses when calculating Net Profit.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowDistModal(false)} className="px-4 py-2 text-slate-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-bold text-white rounded-xl">
                  {isSubmitting ? 'Recording...' : 'Disburse Distribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
