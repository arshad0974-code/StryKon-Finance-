import React, { useState } from 'react';
import { Client, Contract, Invoice, Account, Partner } from '../types';
import { formatPKR, formatUSD, formatDate } from '../utils/formatters';
import { FileText, Users, Plus, DollarSign, Clock, AlertTriangle, CheckCircle, Search, Calendar, CreditCard } from 'lucide-react';
import { api } from '../api';

interface ClientsInvoicesViewProps {
  clients: Client[];
  contracts: Contract[];
  invoices: Invoice[];
  accounts: Account[];
  partners: Partner[];
  onRefresh: () => void;
  onOpenPaymentForInvoice: (invoice: Invoice) => void;
}

export const ClientsInvoicesView: React.FC<ClientsInvoicesViewProps> = ({
  clients,
  contracts,
  invoices,
  accounts,
  partners,
  onRefresh,
  onOpenPaymentForInvoice
}) => {
  const [subTab, setSubTab] = useState<'invoices' | 'clients' | 'contracts'>('invoices');
  const [search, setSearch] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Invoice form state
  const [invClientId, setInvClientId] = useState<number>(clients[0]?.id || 1);
  const [invContractId, setInvContractId] = useState<number | ''>('');
  const [invIssueDate, setInvIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [invDueDate, setInvDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [invCurrency, setInvCurrency] = useState<'PKR' | 'USD'>('USD');
  const [invExchangeRate, setInvExchangeRate] = useState<number>(280);
  const [invItems, setInvItems] = useState<{ description: string; quantity: number; unit_price: number }[]>([
    { description: 'Digital Marketing & Retainer', quantity: 1, unit_price: 1500 }
  ]);
  const [invNotes, setInvNotes] = useState('');

  // Client form state
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCountry, setClientCountry] = useState('Pakistan');

  // Contract form state
  const [conClientId, setConClientId] = useState<number>(clients[0]?.id || 1);
  const [conTitle, setConTitle] = useState('');
  const [conValue, setConValue] = useState(2500);
  const [conCurrency, setConCurrency] = useState<'PKR' | 'USD'>('USD');
  const [conRate, setConRate] = useState(280);
  const [conCycle, setConCycle] = useState<'monthly' | 'milestone' | 'one_time'>('monthly');

  // Invoice subtotal calculation
  const invSubtotal = invItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  const invTotalPkr = invCurrency === 'USD' ? invSubtotal * invExchangeRate : invSubtotal;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invClientId || invItems.length === 0) {
      setErrorMsg('Please select a client and add at least one line item.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await api.createInvoice({
        client_id: invClientId,
        contract_id: invContractId ? Number(invContractId) : null,
        issue_date: invIssueDate,
        due_date: invDueDate,
        currency: invCurrency,
        exchange_rate: invCurrency === 'USD' ? Number(invExchangeRate) : 1.0,
        items: invItems,
        notes: invNotes
      });
      setSuccessMsg('Invoice generated successfully and booked into billing ledger.');
      setShowInvoiceModal(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientCompany) {
      setErrorMsg('Name and Company Name are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createClient({
        name: clientName,
        company_name: clientCompany,
        email: clientEmail,
        phone: clientPhone,
        country: clientCountry
      });
      setSuccessMsg('Client profile added successfully.');
      setShowClientModal(false);
      setClientName('');
      setClientCompany('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conTitle || !conValue) {
      setErrorMsg('Contract Title and Value are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createContract({
        client_id: conClientId,
        title: conTitle,
        contract_value: Number(conValue),
        currency: conCurrency,
        exchange_rate: conCurrency === 'USD' ? Number(conRate) : 1.0,
        start_date: new Date().toISOString().split('T')[0],
        billing_cycle: conCycle
      });
      setSuccessMsg('Contract created successfully.');
      setShowContractModal(false);
      setConTitle('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create contract');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Bar with Subtabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Clients, Contracts & Invoices
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end client revenue engine with relational contracts, partial payments, and auto-overdue tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {subTab === 'invoices' && (
            <button
              id="new-invoice-btn"
              onClick={() => setShowInvoiceModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Invoice
            </button>
          )}
          {subTab === 'clients' && (
            <button
              id="new-client-btn"
              onClick={() => setShowClientModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Client
            </button>
          )}
          {subTab === 'contracts' && (
            <button
              id="new-contract-btn"
              onClick={() => setShowContractModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Contract
            </button>
          )}
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

      {/* Subtab Navigator */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          id="subtab-invoices"
          onClick={() => setSubTab('invoices')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            subTab === 'invoices' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Invoices & Receivables ({invoices.length})
        </button>
        <button
          id="subtab-clients"
          onClick={() => setSubTab('clients')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            subTab === 'clients' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Client Directory ({clients.length})
        </button>
        <button
          id="subtab-contracts"
          onClick={() => setSubTab('contracts')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            subTab === 'contracts' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Active Contracts ({contracts.length})
        </button>
      </div>

      {/* SUBTAB 1: INVOICES */}
      {subTab === 'invoices' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3">Issue Date</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3 text-right">Total Amount</th>
                  <th className="py-3 px-3 text-right">Paid</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-300">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">
                      {inv.client_name}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {formatDate(inv.issue_date)}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {formatDate(inv.due_date)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      {inv.currency === 'USD' ? (
                        <div>
                          <span className="text-emerald-400">{formatUSD(inv.total_amount)}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">(PKR {Math.round(inv.total_amount_pkr).toLocaleString()})</span>
                        </div>
                      ) : (
                        formatPKR(inv.total_amount)
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400 font-semibold">
                      {inv.currency === 'USD' ? formatUSD(inv.paid_amount) : formatPKR(inv.paid_amount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={inv.balance_due > 0 ? (inv.status === 'overdue' ? 'text-rose-400' : 'text-amber-400') : 'text-slate-500'}>
                        {inv.currency === 'USD' ? formatUSD(inv.balance_due) : formatPKR(inv.balance_due)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        inv.status === 'partially_paid' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        inv.status === 'overdue' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {inv.balance_due > 0 ? (
                        <button
                          onClick={() => onOpenPaymentForInvoice(inv)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors"
                        >
                          Record Payment
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px] font-medium flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-500" /> Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CLIENTS */}
      {subTab === 'clients' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">{c.company_name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{c.name} • {c.country}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  {c.status}
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Billed:</span>
                  <span className="font-semibold text-white">{formatPKR(c.total_billed_pkr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Collected:</span>
                  <span className="font-semibold text-emerald-400">{formatPKR(c.total_paid_pkr)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-700/60 pt-1 mt-1">
                  <span className="text-slate-400">Outstanding:</span>
                  <span className={`font-bold ${(c.outstanding_balance_pkr || 0) > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {formatPKR(c.outstanding_balance_pkr)}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>{c.email || 'No email registered'}</span>
                <span>{c.contract_count} Active Contract(s)</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 3: CONTRACTS */}
      {subTab === 'contracts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Contract #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Title / Scope</th>
                  <th className="py-3 px-3">Billing Cycle</th>
                  <th className="py-3 px-3 text-right">Value (Original)</th>
                  <th className="py-3 px-4 text-right">Value (PKR)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {contracts.map((ct) => (
                  <tr key={ct.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-300">
                      {ct.contract_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {ct.client_name}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                      {ct.title}
                    </td>
                    <td className="py-3 px-3 capitalize text-slate-400">
                      {ct.billing_cycle}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      {ct.currency === 'USD' ? (
                        <span className="text-emerald-400">{formatUSD(ct.contract_value)} <span className="text-[10px] text-slate-400">(@{ct.exchange_rate})</span></span>
                      ) : (
                        formatPKR(ct.contract_value)
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {formatPKR(ct.contract_value_pkr)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                        {ct.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Issue Client Invoice
              </h3>
              <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Client *</label>
                  <select
                    value={invClientId}
                    onChange={(e) => setInvClientId(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company_name} ({c.name})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contract (Optional)</label>
                  <select
                    value={invContractId}
                    onChange={(e) => setInvContractId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="">None / Ad-hoc Service</option>
                    {contracts.filter(c => c.client_id === invClientId).map(c => (
                      <option key={c.id} value={c.id}>{c.contract_number} - {c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={invIssueDate}
                    onChange={(e) => setInvIssueDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={invDueDate}
                    onChange={(e) => setInvDueDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Currency</label>
                  <select
                    value={invCurrency}
                    onChange={(e) => setInvCurrency(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="PKR">PKR (Rs)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Exchange Rate</label>
                  <input
                    type="number"
                    value={invExchangeRate}
                    disabled={invCurrency === 'PKR'}
                    onChange={(e) => setInvExchangeRate(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2 border border-slate-800 p-3 rounded-xl bg-slate-850">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Invoice Line Items</span>
                  <button
                    type="button"
                    onClick={() => setInvItems([...invItems, { description: '', quantity: 1, unit_price: 100 }])}
                    className="text-[11px] text-emerald-400 hover:underline font-medium"
                  >
                    + Add Item
                  </button>
                </div>

                {invItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Service description"
                      value={item.description}
                      onChange={(e) => {
                        const copy = [...invItems];
                        copy[idx].description = e.target.value;
                        setInvItems(copy);
                      }}
                      className="col-span-6 bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const copy = [...invItems];
                        copy[idx].quantity = Number(e.target.value);
                        setInvItems(copy);
                      }}
                      className="col-span-2 bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) => {
                        const copy = [...invItems];
                        copy[idx].unit_price = Number(e.target.value);
                        setInvItems(copy);
                      }}
                      className="col-span-3 bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white text-xs"
                    />
                    {invItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setInvItems(invItems.filter((_, i) => i !== idx))}
                        className="col-span-1 text-rose-400 hover:text-rose-300 text-center font-bold"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-bold text-white">
                  <span>Calculated Total:</span>
                  <span>
                    {invCurrency === 'USD' ? `${formatUSD(invSubtotal)} (PKR ${Math.round(invTotalPkr).toLocaleString()})` : formatPKR(invSubtotal)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Invoice Notes / Bank Instructions</label>
                <textarea
                  rows={2}
                  value={invNotes}
                  onChange={(e) => setInvNotes(e.target.value)}
                  placeholder="e.g., Please wire to Strykon Corporate HBL or Stripe USD..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-xl shadow-sm"
                >
                  {isSubmitting ? 'Generating...' : 'Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CLIENT MODAL */}
      {showClientModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add New Client</h3>
            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Contact Person *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g., Sarah Jenkins"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  placeholder="e.g., Apex Global Tech"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@company.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Country</label>
                <input
                  type="text"
                  value={clientCountry}
                  onChange={(e) => setClientCountry(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowClientModal(false)} className="px-4 py-2 text-slate-400">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-bold text-white rounded-xl">
                  {isSubmitting ? 'Saving...' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CONTRACT MODAL */}
      {showContractModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">New Service Contract</h3>
            <form onSubmit={handleCreateContract} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Client *</label>
                <select
                  value={conClientId}
                  onChange={(e) => setConClientId(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Contract Title / Retainer *</label>
                <input
                  type="text"
                  required
                  value={conTitle}
                  onChange={(e) => setConTitle(e.target.value)}
                  placeholder="e.g., SEO & Performance Retainer"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Value</label>
                  <input
                    type="number"
                    value={conValue}
                    onChange={(e) => setConValue(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Currency</label>
                  <select
                    value={conCurrency}
                    onChange={(e) => setConCurrency(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="USD">USD</option>
                    <option value="PKR">PKR</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowContractModal(false)} className="px-4 py-2 text-slate-400">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 font-bold text-white rounded-xl">
                  {isSubmitting ? 'Saving...' : 'Create Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
