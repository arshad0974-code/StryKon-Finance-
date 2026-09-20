import React, { useState, useMemo } from 'react';
import { Client, Contract, Invoice, Account, Partner } from '../types';
import { formatPKR, formatUSD, formatDate } from '../utils/formatters';
import { FileText, Users, Plus, DollarSign, Clock, AlertTriangle, CheckCircle, Search, Calendar, CreditCard, Eye, Edit2, Printer, X } from 'lucide-react';
import { api } from '../api';
import { EditableCombobox, ComboboxOption } from './EditableCombobox';

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

  // Details/Receipt and Edit invoice states
  const [viewingReceiptInvoice, setViewingReceiptInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editInvDueDate, setEditInvDueDate] = useState('');
  const [editInvCurrency, setEditInvCurrency] = useState<'PKR' | 'USD'>('PKR');
  const [editInvExchangeRate, setEditInvExchangeRate] = useState<number>(280);
  const [editInvTotalAmount, setEditInvTotalAmount] = useState<number>(0);
  const [editInvStatus, setEditInvStatus] = useState<string>('sent');
  const [editInvNotes, setEditInvNotes] = useState('');

  // Invoice form state
  const [invClientName, setInvClientName] = useState('');
  const [invClientId, setInvClientId] = useState<number | null>(null);
  const [invContractId, setInvContractId] = useState<number | ''>('');
  const [invIssueDate, setInvIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [invDueDate, setInvDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [invCurrency, setInvCurrency] = useState<'PKR' | 'USD'>('PKR');
  const [invExchangeRate, setInvExchangeRate] = useState<number>(280);
  const [invItems, setInvItems] = useState<{ description: string; quantity: number; unit_price: number }[]>([
    { description: 'Digital Marketing & Retainer', quantity: 1, unit_price: 100000 }
  ]);
  const [invNotes, setInvNotes] = useState('');

  // Client form state
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCountry, setClientCountry] = useState('Pakistan');

  // Contract form state
  const [conClientName, setConClientName] = useState('');
  const [conClientId, setConClientId] = useState<number | null>(null);
  const [conTitle, setConTitle] = useState('');
  const [conValue, setConValue] = useState(100000);
  const [conCurrency, setConCurrency] = useState<'PKR' | 'USD'>('PKR');
  const [conRate, setConRate] = useState(280);
  const [conCycle, setConCycle] = useState<'monthly' | 'milestone' | 'one_time'>('monthly');

  // Options for EditableCombobox
  const clientOptions: ComboboxOption[] = useMemo(() => {
    return clients.map(c => ({
      id: c.id,
      label: c.company_name || c.name,
      sublabel: c.name && c.company_name && c.name !== c.company_name ? `Contact: ${c.name} · ${c.country || 'Pakistan'}` : (c.country || 'Client Profile'),
      meta: c
    }));
  }, [clients]);

  const handleInvClientNameChange = (val: string) => {
    setInvClientName(val);
    const match = clients.find(c =>
      (c.company_name && c.company_name.toLowerCase() === val.trim().toLowerCase()) ||
      (c.name && c.name.toLowerCase() === val.trim().toLowerCase())
    );
    if (match) {
      setInvClientId(match.id);
    } else {
      setInvClientId(null);
      setInvContractId('');
    }
  };

  const handleSelectInvClient = (opt: ComboboxOption) => {
    setInvClientName(opt.label);
    if (opt.id) {
      setInvClientId(Number(opt.id));
    }
  };

  const handleConClientNameChange = (val: string) => {
    setConClientName(val);
    const match = clients.find(c =>
      (c.company_name && c.company_name.toLowerCase() === val.trim().toLowerCase()) ||
      (c.name && c.name.toLowerCase() === val.trim().toLowerCase())
    );
    if (match) {
      setConClientId(match.id);
    } else {
      setConClientId(null);
    }
  };

  const handleSelectConClient = (opt: ComboboxOption) => {
    setConClientName(opt.label);
    if (opt.id) {
      setConClientId(Number(opt.id));
    }
  };

  // Invoice subtotal calculation
  const invSubtotal = invItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  const invTotalPkr = invCurrency === 'USD' ? invSubtotal * invExchangeRate : invSubtotal;

  const pkrInvoices = useMemo(() => invoices.filter(inv => (inv.currency || 'PKR') === 'PKR'), [invoices]);
  const usdInvoices = useMemo(() => invoices.filter(inv => inv.currency === 'USD'), [invoices]);

  const totalPkrInvoiced = useMemo(() => pkrInvoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0), [pkrInvoices]);
  const totalPkrDue = useMemo(() => pkrInvoices.reduce((sum, i) => sum + (Number(i.balance_due) || 0), 0), [pkrInvoices]);
  const totalPkrPaid = useMemo(() => pkrInvoices.reduce((sum, i) => sum + (Number(i.paid_amount) || 0), 0), [pkrInvoices]);

  const totalUsdInvoiced = useMemo(() => usdInvoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0), [usdInvoices]);
  const totalUsdDue = useMemo(() => usdInvoices.reduce((sum, i) => sum + (Number(i.balance_due) || 0), 0), [usdInvoices]);
  const totalUsdPaid = useMemo(() => usdInvoices.reduce((sum, i) => sum + (Number(i.paid_amount) || 0), 0), [usdInvoices]);

  const handleOpenEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditInvDueDate(inv.due_date || '');
    setEditInvCurrency((inv.currency as 'PKR' | 'USD') || 'PKR');
    setEditInvExchangeRate(inv.exchange_rate || 280);
    setEditInvTotalAmount(inv.total_amount || 0);
    setEditInvStatus(inv.status || 'sent');
    setEditInvNotes(inv.notes || '');
  };

  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await api.updateInvoice(editingInvoice.id, {
        currency: editInvCurrency,
        exchange_rate: editInvCurrency === 'USD' ? Number(editInvExchangeRate) : 1.0,
        due_date: editInvDueDate,
        total_amount: Number(editInvTotalAmount),
        status: editInvStatus,
        notes: editInvNotes
      });
      setSuccessMsg(`Invoice ${editingInvoice.invoice_number} updated successfully.`);
      setEditingInvoice(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = invClientName.trim();
    if (!trimmedName || invItems.length === 0) {
      setErrorMsg('Please enter or select a client name and add at least one line item.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      let resolvedId = invClientId;
      if (!resolvedId) {
        const match = clients.find(c =>
          (c.company_name && c.company_name.toLowerCase() === trimmedName.toLowerCase()) ||
          (c.name && c.name.toLowerCase() === trimmedName.toLowerCase())
        );
        if (match) {
          resolvedId = match.id;
        } else {
          // Create new client profile so it exists in system
          const newCli = await api.createClient({
            company_name: trimmedName,
            name: trimmedName,
            country: 'Pakistan',
            email: '',
            phone: ''
          });
          resolvedId = newCli.id;
        }
      }

      await api.createInvoice({
        client_id: resolvedId,
        client_name: trimmedName,
        contract_id: invContractId ? Number(invContractId) : null,
        issue_date: invIssueDate,
        due_date: invDueDate,
        currency: invCurrency,
        exchange_rate: invCurrency === 'USD' ? Number(invExchangeRate) : 1.0,
        items: invItems,
        notes: invNotes
      });
      setSuccessMsg(`Invoice generated successfully for "${trimmedName}" and booked into billing ledger.`);
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
    const trimmedName = conClientName.trim();
    if (!trimmedName || !conTitle || !conValue) {
      setErrorMsg('Client Name, Contract Title and Value are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      let resolvedId = conClientId;
      if (!resolvedId) {
        const match = clients.find(c =>
          (c.company_name && c.company_name.toLowerCase() === trimmedName.toLowerCase()) ||
          (c.name && c.name.toLowerCase() === trimmedName.toLowerCase())
        );
        if (match) {
          resolvedId = match.id;
        } else {
          const newCli = await api.createClient({
            company_name: trimmedName,
            name: trimmedName,
            country: 'Pakistan',
            email: '',
            phone: ''
          });
          resolvedId = newCli.id;
        }
      }

      await api.createContract({
        client_id: resolvedId,
        client_name: trimmedName,
        title: conTitle,
        contract_value: Number(conValue),
        currency: conCurrency,
        exchange_rate: conCurrency === 'USD' ? Number(conRate) : 1.0,
        start_date: new Date().toISOString().split('T')[0],
        billing_cycle: conCycle
      });
      setSuccessMsg(`Contract created successfully for "${trimmedName}".`);
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
        <div className="space-y-4">
          {/* Dual Currency Metrics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Invoiced (PKR)</span>
              <div className="text-lg font-bold font-mono text-white">
                ₨ {totalPkrInvoiced.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-400 mt-1 block">₨ {totalPkrPaid.toLocaleString()} paid</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Outstanding Due (PKR)</span>
              <div className="text-lg font-bold font-mono text-amber-400">
                ₨ {totalPkrDue.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">{pkrInvoices.length} PKR invoices total</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Invoiced (USD)</span>
              <div className="text-lg font-bold font-mono text-emerald-400">
                ${totalUsdInvoiced.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-300 mt-1 block">${totalUsdPaid.toLocaleString()} paid</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Outstanding Due (USD)</span>
              <div className="text-lg font-bold font-mono text-rose-400">
                ${totalUsdDue.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">{usdInvoices.length} USD invoices total</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-3">Client</th>
                    <th className="py-3 px-3">Currency</th>
                    <th className="py-3 px-3">Due Date</th>
                    <th className="py-3 px-3 text-right">Total Amount</th>
                    <th className="py-3 px-3 text-right">Paid</th>
                    <th className="py-3 px-3 text-right">Balance Due</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {invoices.map((inv) => {
                    const isUsd = inv.currency === 'USD';
                    return (
                      <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-300">
                          {inv.invoice_number}
                        </td>
                        <td className="py-3 px-3 font-semibold text-white">
                          {inv.client_name}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            isUsd ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {isUsd ? 'USD ($)' : 'PKR (₨)'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {formatDate(inv.due_date)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold">
                          {isUsd ? (
                            <div>
                              <span className="text-emerald-400">${Number(inv.total_amount).toLocaleString()}</span>
                              <span className="text-[10px] text-slate-400 block font-normal">(PKR {Math.round(inv.total_amount_pkr).toLocaleString()})</span>
                            </div>
                          ) : (
                            <span>₨ {Number(inv.total_amount).toLocaleString()}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400 font-semibold">
                          {isUsd ? `$${Number(inv.paid_amount || 0).toLocaleString()}` : `₨ ${Number(inv.paid_amount || 0).toLocaleString()}`}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          <span className={inv.balance_due > 0 ? (inv.status === 'overdue' ? 'text-rose-400' : 'text-amber-400') : 'text-slate-500'}>
                            {isUsd ? `$${Number(inv.balance_due).toLocaleString()}` : `₨ ${Number(inv.balance_due).toLocaleString()}`}
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
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingReceiptInvoice(inv)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="View Invoice Receipt / Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditInvoice(inv)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Edit Invoice"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {inv.balance_due > 0 ? (
                              <button
                                type="button"
                                onClick={() => onOpenPaymentForInvoice(inv)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors"
                              >
                                Record Payment
                              </button>
                            ) : (
                              <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-500" /> Settled
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-semibold">Client Name *</label>
                    {invClientId ? (
                      <span className="text-[10px] text-emerald-400 font-medium">Existing Client Profile</span>
                    ) : invClientName.trim() ? (
                      <span className="text-[10px] text-blue-400 font-medium">+ New client profile</span>
                    ) : null}
                  </div>
                  <EditableCombobox
                    id="invoice-client-name"
                    value={invClientName}
                    onChange={handleInvClientNameChange}
                    onSelectOption={handleSelectInvClient}
                    options={clientOptions}
                    placeholder="Type client name or select existing..."
                    required
                    createNewText="Bill new client"
                    emptyText="No matching clients. Enter new client name to bill."
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contract (Optional)</label>
                  <select
                    value={invContractId}
                    onChange={(e) => setInvContractId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="">None / Ad-hoc Service</option>
                    {contracts.filter(c => invClientId && c.client_id === invClientId).map(c => (
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
                  <label className="block text-slate-300 font-semibold mb-1">Currency *</label>
                  <select
                    id="inv-currency-select"
                    value={invCurrency}
                    onChange={(e) => setInvCurrency(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="PKR">PKR — Pakistani Rupee (₨)</option>
                    <option value="USD">USD — US Dollar ($)</option>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">Client Name *</label>
                  {conClientId ? (
                    <span className="text-[10px] text-emerald-400 font-medium">Existing Client Profile</span>
                  ) : conClientName.trim() ? (
                    <span className="text-[10px] text-blue-400 font-medium">+ New client profile</span>
                  ) : null}
                </div>
                <EditableCombobox
                  id="contract-client-name"
                  value={conClientName}
                  onChange={handleConClientNameChange}
                  onSelectOption={handleSelectConClient}
                  options={clientOptions}
                  placeholder="Type client name or select existing..."
                  required
                  createNewText="Create contract for new client"
                  emptyText="No matching clients. Enter new client name."
                />
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
                  <label className="block text-slate-300 font-semibold mb-1">Currency *</label>
                  <select
                    id="con-currency-select"
                    value={conCurrency}
                    onChange={(e) => setConCurrency(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="PKR">PKR — Pakistani Rupee (₨)</option>
                    <option value="USD">USD — US Dollar ($)</option>
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

      {/* MODAL: INVOICE RECEIPT & DETAILS */}
      {viewingReceiptInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">StryKon Finance Receipt</span>
                <h3 className="text-xl font-bold text-white font-mono mt-0.5">{viewingReceiptInvoice.invoice_number}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingReceiptInvoice(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Billed To:</span>
                <span className="text-white font-bold text-sm block mt-0.5">{viewingReceiptInvoice.client_name}</span>
                <span className="text-slate-400 block mt-1">Issue Date: {formatDate(viewingReceiptInvoice.issue_date)}</span>
                <span className="text-slate-400 block">Due Date: {formatDate(viewingReceiptInvoice.due_date)}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block font-semibold">Currency:</span>
                <span className="text-emerald-400 font-bold font-mono text-sm block mt-0.5">
                  {viewingReceiptInvoice.currency === 'USD' ? 'USD — US Dollar ($)' : 'PKR — Pakistani Rupee (₨)'}
                </span>
                <span className="text-slate-400 block mt-1">Status:</span>
                <span className="font-bold uppercase text-[11px] text-white">
                  {viewingReceiptInvoice.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Line items summary */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 space-y-2 text-xs">
              <div className="flex justify-between font-semibold text-slate-300 border-b border-slate-700/70 pb-2">
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div className="flex justify-between text-slate-200">
                <span>Total Invoiced Services</span>
                <span className="font-mono font-bold">
                  {viewingReceiptInvoice.currency === 'USD' ? `$${Number(viewingReceiptInvoice.total_amount).toLocaleString()}` : `₨ ${Number(viewingReceiptInvoice.total_amount).toLocaleString()}`}
                </span>
              </div>
              {viewingReceiptInvoice.currency === 'USD' && (
                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span>Exchange Rate (Frozen at Issue)</span>
                  <span className="font-mono">PKR {viewingReceiptInvoice.exchange_rate} / USD</span>
                </div>
              )}
              <div className="border-t border-slate-700/70 pt-2 flex justify-between text-emerald-400 font-semibold">
                <span>Total Paid</span>
                <span className="font-mono">
                  {viewingReceiptInvoice.currency === 'USD' ? `$${Number(viewingReceiptInvoice.paid_amount || 0).toLocaleString()}` : `₨ ${Number(viewingReceiptInvoice.paid_amount || 0).toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between text-amber-400 font-bold text-sm pt-1">
                <span>Balance Due</span>
                <span className="font-mono">
                  {viewingReceiptInvoice.currency === 'USD' ? `$${Number(viewingReceiptInvoice.balance_due).toLocaleString()}` : `₨ ${Number(viewingReceiptInvoice.balance_due).toLocaleString()}`}
                </span>
              </div>
            </div>

            {viewingReceiptInvoice.notes && (
              <div className="text-xs text-slate-400 bg-slate-800/30 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-slate-300 block mb-1">Notes:</span>
                {viewingReceiptInvoice.notes}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setViewingReceiptInvoice(null)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT INVOICE */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Edit Invoice {editingInvoice.invoice_number}</h3>
                <p className="text-xs text-slate-400">Client: {editingInvoice.client_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingInvoice(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateInvoice} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Currency *</label>
                  <select
                    id="edit-inv-currency"
                    value={editInvCurrency}
                    onChange={(e) => setEditInvCurrency(e.target.value as 'PKR' | 'USD')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="PKR">PKR — Pakistani Rupee (₨)</option>
                    <option value="USD">USD — US Dollar ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Total Amount *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editInvTotalAmount}
                    onChange={(e) => setEditInvTotalAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={editInvDueDate}
                    onChange={(e) => setEditInvDueDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status *</label>
                  <select
                    value={editInvStatus}
                    onChange={(e) => setEditInvStatus(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="sent">Sent</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {editInvCurrency === 'USD' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Exchange Rate (PKR/USD)</label>
                  <input
                    type="number"
                    value={editInvExchangeRate}
                    onChange={(e) => setEditInvExchangeRate(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editInvNotes}
                  onChange={(e) => setEditInvNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
