import React, { useState, useEffect, useMemo } from 'react';
import { Payment, Invoice, Client, Account, Partner } from '../types';
import { formatPKR, formatUSD, formatDate } from '../utils/formatters';
import { DollarSign, Plus, CheckCircle, Clock, AlertTriangle, UserCheck, ShieldCheck, ArrowDownRight } from 'lucide-react';
import { api } from '../api';
import { EditableCombobox, ComboboxOption } from './EditableCombobox';

interface PaymentsViewProps {
  payments: Payment[];
  invoices: Invoice[];
  clients: Client[];
  accounts: Account[];
  partners: Partner[];
  onRefresh: () => void;
  initialInvoice?: Invoice | null;
  onClearInitialInvoice?: () => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  invoices,
  clients,
  accounts,
  partners,
  onRefresh,
  initialInvoice,
  onClearInitialInvoice
}) => {
  const [showModal, setShowModal] = useState(!!initialInvoice);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const initialClient = clients.find(c => c.id === (initialInvoice ? initialInvoice.client_id : clients[0]?.id));
  const [clientName, setClientName] = useState(initialClient ? (initialClient.company_name || initialClient.name) : '');
  const [clientId, setClientId] = useState<number | null>(initialInvoice ? initialInvoice.client_id : (clients[0]?.id || null));
  const [invoiceId, setInvoiceId] = useState<number | ''>(initialInvoice ? initialInvoice.id : '');
  const [accountId, setAccountId] = useState<number>(accounts[0]?.id || 1);
  const [partnerId, setPartnerId] = useState<number | ''>(1); // Musaddiq or Arshad
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<'PKR' | 'USD'>(initialInvoice?.currency || 'USD');
  const [exchangeRate, setExchangeRate] = useState<number>(initialInvoice?.exchange_rate || 280);
  const [amountOriginal, setAmountOriginal] = useState<number>(initialInvoice ? initialInvoice.balance_due : 100);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [referenceNote, setReferenceNote] = useState('');
  const [isAdvance, setIsAdvance] = useState(false);

  useEffect(() => {
    if (initialInvoice) {
      const cli = clients.find(c => c.id === initialInvoice.client_id);
      if (cli) {
        setClientId(cli.id);
        setClientName(cli.company_name || cli.name);
      }
    } else if (!clientName && clients[0]) {
      setClientId(clients[0].id);
      setClientName(clients[0].company_name || clients[0].name);
    }
  }, [initialInvoice, clients]);

  const clientOptions: ComboboxOption[] = useMemo(() => {
    return clients.map(c => ({
      id: c.id,
      label: c.company_name || c.name,
      sublabel: c.name && c.company_name && c.name !== c.company_name ? `Contact: ${c.name} · ${c.country || 'Pakistan'}` : (c.country || 'Client Profile'),
      meta: c
    }));
  }, [clients]);

  const handleClientNameChange = (val: string) => {
    setClientName(val);
    const match = clients.find(c =>
      (c.company_name && c.company_name.toLowerCase() === val.trim().toLowerCase()) ||
      (c.name && c.name.toLowerCase() === val.trim().toLowerCase())
    );
    if (match) {
      setClientId(match.id);
    } else {
      setClientId(null);
      setInvoiceId('');
    }
  };

  const handleSelectClient = (opt: ComboboxOption) => {
    setClientName(opt.label);
    if (opt.id) {
      setClientId(Number(opt.id));
      setInvoiceId('');
    }
  };

  // Selected invoice info
  const selectedInvoice = invoices.find(inv => inv.id === Number(invoiceId));

  // Converted amount in PKR
  const amountPkr = currency === 'USD' ? Math.round(amountOriginal * exchangeRate) : amountOriginal;

  const handleOpenModal = () => {
    setErrorMsg('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (onClearInitialInvoice) onClearInitialInvoice();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedClientName = clientName.trim();
    if (!trimmedClientName || !accountId || amountOriginal <= 0) {
      setErrorMsg('Client name, receiving account, and positive amount are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      let resolvedId = clientId;
      if (!resolvedId) {
        const match = clients.find(c =>
          (c.company_name && c.company_name.toLowerCase() === trimmedClientName.toLowerCase()) ||
          (c.name && c.name.toLowerCase() === trimmedClientName.toLowerCase())
        );
        if (match) {
          resolvedId = match.id;
        } else {
          const newCli = await api.createClient({
            company_name: trimmedClientName,
            name: trimmedClientName,
            country: 'Pakistan',
            email: '',
            phone: ''
          });
          resolvedId = newCli.id;
        }
      }

      const res = await api.recordPayment({
        client_id: resolvedId,
        client_name: trimmedClientName,
        invoice_id: invoiceId ? Number(invoiceId) : null,
        account_id: accountId,
        partner_id: partnerId ? Number(partnerId) : null,
        payment_date: paymentDate,
        currency,
        exchange_rate: currency === 'USD' ? Number(exchangeRate) : 1.0,
        amount_original: Number(amountOriginal),
        payment_method: paymentMethod,
        reference_note: referenceNote,
        is_advance: isAdvance ? 1 : 0
      });

      setSuccessMsg(`Receipt ${res.payment_number} recorded successfully! Converted: PKR ${res.amount_pkr.toLocaleString()}`);
      handleCloseModal();
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Client Payments & Receipts
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time receipt ledger tracking payments received by Musaddiq Mustafa or Arshad Qazi, with automated invoice reconciliation and exact USD/PKR dual tracking.
          </p>
        </div>

        <button
          id="record-payment-btn"
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Record Client Payment
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

      {/* Received Payments Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Received Payments Ledger</h3>
          <span className="text-xs text-slate-400">{payments.length} verified receipts</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-3">Linked Invoice</th>
                <th className="py-3 px-3">Partner Attributed</th>
                <th className="py-3 px-3">Receiving Account</th>
                <th className="py-3 px-3 text-right">Original Amount</th>
                <th className="py-3 px-4 text-right">Amount (PKR)</th>
                <th className="py-3 px-3 text-center">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                    {p.payment_number}
                  </td>
                  <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                    {formatDate(p.payment_date)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">
                    {p.client_name}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {p.invoice_number ? (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300">
                        {p.invoice_number}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Unlinked / Advance</span>
                    )}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {p.partner_id ? (
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        p.partner_id === 1 ? 'bg-blue-900/40 text-blue-300 border border-blue-800/60' : 'bg-purple-900/40 text-purple-300 border border-purple-800/60'
                      }`}>
                        {p.partner_id === 1 ? 'Musaddiq Mustafa' : 'Arshad Qazi'}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Agency Core</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-300 text-[11px]">
                    {p.account_name}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium">
                    {p.currency === 'USD' ? (
                      <span className="text-emerald-400 font-bold">
                        {formatUSD(p.amount_original)} <span className="text-[10px] text-slate-400">(@{p.exchange_rate})</span>
                      </span>
                    ) : (
                      formatPKR(p.amount_original)
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                    {formatPKR(p.amount_pkr)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {p.is_advance ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                        Advance
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        Receipt
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                Record Client Payment Receipt
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Client Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">Client Name *</label>
                  {clientId ? (
                    <span className="text-[10px] text-emerald-400 font-medium">Existing Client Profile</span>
                  ) : clientName.trim() ? (
                    <span className="text-[10px] text-blue-400 font-medium">+ New client profile</span>
                  ) : null}
                </div>
                <EditableCombobox
                  id="payment-client-name"
                  value={clientName}
                  onChange={handleClientNameChange}
                  onSelectOption={handleSelectClient}
                  options={clientOptions}
                  placeholder="Type client name or select existing..."
                  required
                  createNewText="Record receipt for new client"
                  emptyText="No matching clients found. You can enter and record receipt for this new client directly."
                />
              </div>

              {/* Link to Invoice */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Link to Invoice (Optional for advances)</label>
                <select
                  value={invoiceId}
                  onChange={(e) => {
                    const invId = e.target.value ? Number(e.target.value) : '';
                    setInvoiceId(invId);
                    const inv = invoices.find(i => i.id === invId);
                    if (inv) {
                      setCurrency(inv.currency);
                      setExchangeRate(inv.exchange_rate);
                      setAmountOriginal(inv.balance_due);
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option value="">No Invoice / Direct Advance Payment</option>
                  {invoices.filter(i => i.client_id === clientId && i.balance_due > 0).map(i => (
                    <option key={i.id} value={i.id}>
                      {i.invoice_number} — Total: {i.currency} {i.total_amount} | Balance: {i.currency} {i.balance_due}
                    </option>
                  ))}
                </select>
              </div>

              {/* Invoice Balance Banner */}
              {selectedInvoice && (
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Invoice Total:</span>
                    <span className="font-semibold text-white">{selectedInvoice.currency} {selectedInvoice.total_amount}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Already Paid:</span>
                    <span className="font-semibold text-emerald-400">{selectedInvoice.currency} {selectedInvoice.paid_amount}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 font-bold border-t border-slate-700 pt-1">
                    <span>Remaining Balance Due:</span>
                    <span className="text-amber-400">{selectedInvoice.currency} {selectedInvoice.balance_due}</span>
                  </div>
                </div>
              )}

              {/* Currency & Amount Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="PKR">PKR (Rs)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amountOriginal}
                    onChange={(e) => setAmountOriginal(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Exchange Rate</label>
                  <input
                    type="number"
                    value={exchangeRate}
                    disabled={currency === 'PKR'}
                    onChange={(e) => setExchangeRate(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white disabled:opacity-50 font-mono"
                  />
                </div>
              </div>

              {/* Live Conversion Banner */}
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-300">Converted PKR equivalent:</span>
                <span className="font-bold text-emerald-400 text-sm font-mono">
                  {formatPKR(amountPkr)}
                </span>
              </div>

              {/* Partner Attribution & Receiving Account */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Receiving Partner *</label>
                  <select
                    value={partnerId}
                    onChange={(e) => setPartnerId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="">Agency General</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Appears in their specific partner ledger</span>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Deposit Account *</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.currency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="stripe">Stripe</option>
                    <option value="bank_transfer">Bank Wire</option>
                    <option value="cash">Cash</option>
                    <option value="payoneer">Payoneer</option>
                    <option value="wise">Wise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reference / Transaction Notes</label>
                <input
                  type="text"
                  placeholder="e.g., Wire ref #123456 or Stripe deposit"
                  value={referenceNote}
                  onChange={(e) => setReferenceNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is-advance-check"
                  checked={isAdvance}
                  onChange={(e) => setIsAdvance(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="is-advance-check" className="text-slate-300 font-medium cursor-pointer">
                  Record as Client Advance (Kept separate from earned operating revenue)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-xl shadow-sm"
                >
                  {isSubmitting ? 'Recording...' : 'Confirm Receipt'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
