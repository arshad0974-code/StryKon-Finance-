import React, { useState, useMemo } from 'react';
import {
  History,
  Trash2,
  AlertTriangle,
  Search,
  CheckSquare,
  Square,
  FileText,
  TrendingDown,
  DollarSign,
  Building2,
  RefreshCw,
  CheckCircle2,
  Filter,
  X,
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import {
  Transaction,
  Invoice,
  Expense,
  Payment,
  PartnerDistribution,
  Loan,
  Account,
  Partner,
  HistoryRecord
} from '../types';
import { api } from '../api';

interface PreviousDataViewProps {
  transactions: Transaction[];
  invoices: Invoice[];
  expenses: Expense[];
  payments: Payment[];
  distributions: PartnerDistribution[];
  loans: Loan[];
  accounts: Account[];
  partners: Partner[];
  onRefresh: () => Promise<void>;
  onNavigateTab?: (tab: any) => void;
}

export const PreviousDataView: React.FC<PreviousDataViewProps> = ({
  transactions,
  invoices,
  expenses,
  payments,
  distributions,
  loans,
  accounts,
  partners,
  onRefresh,
  onNavigateTab
}) => {
  // State
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal confirmation states
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<HistoryRecord | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState<boolean>(false);

  // Map accounts for quick lookup
  const accountMap = useMemo(() => {
    const map = new Map<number, Account>();
    accounts.forEach(a => map.set(a.id, a));
    return map;
  }, [accounts]);

  // Aggregate all items into a unified HistoryRecord list
  const allHistoryRecords = useMemo<HistoryRecord[]>(() => {
    const records: HistoryRecord[] = [];

    // 1. Invoices
    invoices.forEach(inv => {
      records.push({
        id: `invoice-${inv.id}`,
        rawId: inv.id,
        type: 'invoice',
        typeLabel: 'Invoice',
        title: inv.invoice_number,
        subtitle: inv.client_name || `Client #${inv.client_id}`,
        date: inv.issue_date || '',
        amount: inv.total_amount_pkr || inv.total_amount,
        currency: inv.currency || 'PKR',
        category: 'Client Billing',
        status: inv.status,
        details: `Subtotal: ${inv.subtotal} • Balance Due: ${inv.balance_due}`
      });
    });

    // 2. Expenses
    expenses.forEach(exp => {
      const acc = exp.account_id ? accountMap.get(exp.account_id) : null;
      records.push({
        id: `expense-${exp.id}`,
        rawId: exp.id,
        type: 'expense',
        typeLabel: 'Expense',
        title: exp.expense_number || `EXP-#${exp.id}`,
        subtitle: exp.title || exp.category,
        date: exp.expense_date,
        amount: exp.amount_pkr,
        currency: exp.currency || 'PKR',
        category: exp.category,
        status: 'recorded',
        details: acc ? `Paid via ${acc.name}` : undefined
      });
    });

    // 3. Client Payments
    payments.forEach(pay => {
      const acc = pay.account_id ? accountMap.get(pay.account_id) : null;
      records.push({
        id: `payment-${pay.id}`,
        rawId: pay.id,
        type: 'payment',
        typeLabel: 'Payment',
        title: pay.payment_number || `PAY-#${pay.id}`,
        subtitle: pay.client_name || `Receipt from Client #${pay.client_id || ''}`,
        date: pay.payment_date,
        amount: pay.amount_pkr,
        currency: pay.currency || 'PKR',
        category: pay.is_advance ? 'Advance Payment' : 'Invoice Payment',
        status: 'received',
        details: acc ? `Deposited to ${acc.name}` : undefined
      });
    });

    // 4. Partner Distributions / Dividends
    distributions.forEach(dist => {
      const partner = partners.find(p => p.id === dist.partner_id);
      records.push({
        id: `distribution-${dist.id}`,
        rawId: dist.id,
        type: 'distribution',
        typeLabel: 'Distribution',
        title: dist.distribution_number || `DIST-#${dist.id}`,
        subtitle: partner ? `${partner.name} (${dist.distribution_type})` : dist.distribution_type,
        date: dist.distribution_date,
        amount: dist.amount_pkr,
        currency: dist.currency || 'PKR',
        category: 'Partner Equity',
        status: dist.status || 'approved',
        details: dist.notes || undefined
      });
    });

    // 5. Loans
    loans.forEach(loan => {
      records.push({
        id: `loan-${loan.id}`,
        rawId: loan.id,
        type: 'loan',
        typeLabel: 'Loan',
        title: loan.loan_number || `LOAN-#${loan.id}`,
        subtitle: `${loan.lender_name} (${loan.loan_type})`,
        date: loan.start_date,
        amount: loan.principal_pkr || loan.principal_amount,
        currency: loan.currency || 'PKR',
        category: 'Liability / Financing',
        status: loan.status,
        details: `Balance: ${loan.remaining_principal_pkr} PKR`
      });
    });

    // 6. Transactions (General Journal entries not already covered)
    transactions.forEach(txn => {
      // If transaction has an explicit reference already represented, skip duplicate or show as Journal
      const hasSpecific = records.some(r => r.type === txn.reference_type && r.rawId === txn.reference_id);
      if (!hasSpecific) {
        records.push({
          id: `transaction-${txn.id}`,
          rawId: txn.id,
          type: 'transaction',
          typeLabel: 'Journal',
          title: txn.transaction_number,
          subtitle: txn.description,
          date: txn.date,
          amount: txn.amount_pkr,
          currency: txn.currency || 'PKR',
          category: txn.transaction_type.replace('_', ' '),
          status: txn.is_reversed ? 'reversed' : 'cleared',
          details: txn.partner_id ? `Partner #${txn.partner_id}` : undefined
        });
      }
    });

    // Sort by date descending
    return records.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [invoices, expenses, payments, distributions, loans, transactions, accountMap, partners]);

  // Filtered records based on tab and search
  const filteredRecords = useMemo(() => {
    return allHistoryRecords.filter(rec => {
      // Type filter
      if (filterType !== 'all') {
        if (filterType === 'loans_distributions') {
          if (rec.type !== 'loan' && rec.type !== 'distribution') return false;
        } else if (rec.type !== filterType) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = rec.title.toLowerCase().includes(q);
        const matchesSubtitle = rec.subtitle?.toLowerCase().includes(q) || false;
        const matchesCategory = rec.category?.toLowerCase().includes(q) || false;
        const matchesDate = rec.date.includes(q);
        const matchesAmount = rec.amount.toString().includes(q);
        return matchesTitle || matchesSubtitle || matchesCategory || matchesDate || matchesAmount;
      }

      return true;
    });
  }, [allHistoryRecords, filterType, searchQuery]);

  // Selection handlers
  const allFilteredSelected = filteredRecords.length > 0 && filteredRecords.every(r => selectedIds.has(r.id));
  const someFilteredSelected = filteredRecords.some(r => selectedIds.has(r.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      // Deselect all in current view
      const next = new Set(selectedIds);
      filteredRecords.forEach(r => next.delete(r.id));
      setSelectedIds(next);
    } else {
      // Select all in current view
      const next = new Set(selectedIds);
      filteredRecords.forEach(r => next.add(r.id));
      setSelectedIds(next);
    }
  };

  const handleToggleSingle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Perform single deletion
  const executeSingleDelete = async () => {
    if (!singleDeleteTarget) return;
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await api.deleteHistoryItem(singleDeleteTarget.type, singleDeleteTarget.rawId);
      setSuccessMsg(`Record ${singleDeleteTarget.title} (${singleDeleteTarget.typeLabel}) deleted successfully.`);
      // Remove from selection if it was selected
      const next = new Set(selectedIds);
      next.delete(singleDeleteTarget.id);
      setSelectedIds(next);
      setSingleDeleteTarget(null);
      await onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete record.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Perform bulk deletion of selected records
  const executeBulkDelete = async () => {
    const itemsToDelete = allHistoryRecords
      .filter(r => selectedIds.has(r.id))
      .map(r => ({ type: r.type, id: r.rawId }));

    if (itemsToDelete.length === 0) return;

    setIsDeleting(true);
    setErrorMsg(null);
    try {
      const res = await api.deleteHistoryMultiple(itemsToDelete);
      setSuccessMsg(`Successfully deleted ${res.deletedCount || itemsToDelete.length} records.`);
      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
      await onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete selected records.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Perform Delete All
  const executeDeleteAll = async () => {
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await api.deleteAllHistory();
      setSuccessMsg('All previous calculator history has been permanently deleted.');
      setSelectedIds(new Set());
      setShowDeleteAllModal(false);
      await onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete all records.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Type badge styling
  const getTypeBadge = (type: string, label: string) => {
    switch (type) {
      case 'invoice':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">{label}</span>;
      case 'expense':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">{label}</span>;
      case 'payment':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{label}</span>;
      case 'distribution':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">{label}</span>;
      case 'loan':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{label}</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">{label}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Previous Data Management
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {allHistoryRecords.length} Saved Records
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              View, select, and manage all previously saved calculator calculations and financial entries with double-entry integrity.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onRefresh()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
            title="Refresh records"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            id="delete-all-btn"
            onClick={() => setShowDeleteAllModal(true)}
            disabled={allHistoryRecords.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-40 disabled:pointer-events-none rounded-lg border border-rose-500/30 transition shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete All Data
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {successMsg && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All Records ({allHistoryRecords.length})
          </button>
          <button
            onClick={() => setFilterType('invoice')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              filterType === 'invoice'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              filterType === 'expense'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Expenses ({expenses.length})
          </button>
          <button
            onClick={() => setFilterType('payment')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              filterType === 'payment'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Payments ({payments.length})
          </button>
          <button
            onClick={() => setFilterType('loans_distributions')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              filterType === 'loans_distributions'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Dividends & Loans ({distributions.length + loans.length})
          </button>
          <button
            onClick={() => setFilterType('transaction')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              filterType === 'transaction'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Journal Entries ({transactions.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records, dates, amounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Multi-Select Toolbar */}
      <div className="flex items-center justify-between bg-slate-800/60 px-4 py-2.5 rounded-xl border border-slate-700/80 text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleSelectAll}
            disabled={filteredRecords.length === 0}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white disabled:opacity-40 transition font-medium"
          >
            {allFilteredSelected ? (
              <CheckSquare className="w-4 h-4 text-indigo-400" />
            ) : someFilteredSelected ? (
              <div className="w-4 h-4 rounded border border-indigo-400 bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-[10px] font-bold">-</div>
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            <span>Select All</span>
          </button>

          <span className="text-slate-400">
            {selectedIds.size > 0 ? (
              <span className="text-indigo-300 font-semibold">{selectedIds.size} record{selectedIds.size > 1 ? 's' : ''} selected</span>
            ) : (
              <span>Showing {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1"
            >
              Deselect All
            </button>
          )}

          <button
            id="delete-selected-btn"
            onClick={() => setShowBulkDeleteModal(true)}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium disabled:opacity-40 disabled:pointer-events-none transition shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Selected {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </button>
        </div>
      </div>

      {/* Main Records Table / Empty State */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-2xl border border-slate-800/80">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-500 mb-4">
            <History className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No previous data available</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
            {allHistoryRecords.length === 0
              ? 'All previous calculator records have been removed. Use the calculator tabs to add new transactions, invoices, or expenses.'
              : 'No records match your active search or category filter. Try changing your search query or selecting "All Records".'}
          </p>

          {allHistoryRecords.length === 0 && onNavigateTab && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => onNavigateTab('clients_invoices')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Create Invoice
              </button>
              <button
                onClick={() => onNavigateTab('expenses')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
              >
                <TrendingDown className="w-3.5 h-3.5" />
                Log Expense
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-10 text-center">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Record / Reference</th>
                  <th className="py-3 px-4">Details / Description</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredRecords.map((record) => {
                  const isSelected = selectedIds.has(record.id);
                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-slate-800/40 transition group ${
                        isSelected ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSingle(record.id)}
                          className="text-slate-400 hover:text-indigo-400 transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getTypeBadge(record.type, record.typeLabel)}
                      </td>

                      {/* Record Title & Subtitle */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{record.title}</div>
                        {record.subtitle && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            {record.subtitle}
                          </div>
                        )}
                      </td>

                      {/* Category & Details */}
                      <td className="py-3 px-4">
                        <div className="text-slate-300 capitalize">{record.category || '—'}</div>
                        {record.details && (
                          <div className="text-[11px] text-slate-500">{record.details}</div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                        {record.date || '—'}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 whitespace-nowrap text-right font-medium">
                        <span
                          className={
                            record.type === 'payment'
                              ? 'text-emerald-400 font-semibold'
                              : record.type === 'expense'
                              ? 'text-rose-400'
                              : 'text-slate-200'
                          }
                        >
                          {record.type === 'payment' ? '+' : record.type === 'expense' ? '-' : ''}
                          {record.currency === 'USD' ? '$' : '₨ '}
                          {record.amount.toLocaleString('en-US')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 capitalize border border-slate-700/60">
                          {record.status || 'saved'}
                        </span>
                      </td>

                      {/* Action (Individual Delete) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          id={`delete-btn-${record.id}`}
                          onClick={() => setSingleDeleteTarget(record)}
                          title={`Delete ${record.title}`}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Confirm Single Delete */}
      {singleDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Calculator Record</h3>
                <p className="text-xs text-slate-400">This action will remove the record permanently.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/70 border border-slate-700/80 rounded-xl space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Record:</span>
                <span className="font-semibold text-white">{singleDeleteTarget.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Type:</span>
                <span>{singleDeleteTarget.typeLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-medium text-emerald-400">
                  {singleDeleteTarget.currency === 'USD' ? '$' : '₨ '}{singleDeleteTarget.amount.toLocaleString()}
                </span>
              </div>
              {singleDeleteTarget.date && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span>{singleDeleteTarget.date}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Are you sure you want to delete this specific record? Linked balances and ledger calculations will adjust automatically.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSingleDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSingleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirm Multiple Delete */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Selected Records</h3>
                <p className="text-xs text-slate-400">Permanent removal of multiple items</p>
              </div>
            </div>

            <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-xl text-xs text-rose-200">
              You have selected <span className="font-bold text-white underline">{selectedIds.size}</span> previous calculator record{selectedIds.size > 1 ? 's' : ''}.
              Deleting them will immediately update all related account balances and historical reports.
            </div>

            <p className="text-xs text-slate-400">
              Are you sure you want to delete these {selectedIds.size} records? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeBulkDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : `Delete ${selectedIds.size} Selected`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Confirm Delete All */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Permanently Delete All Previous Data?</h3>
                <p className="text-xs text-rose-300 font-medium">Critical Destructive Action</p>
              </div>
            </div>

            <div className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-xl text-xs text-rose-200 space-y-2">
              <p className="font-semibold text-white">
                Warning: You are about to permanently delete all {allHistoryRecords.length} historical calculator records:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                <li>All invoices and client billings ({invoices.length})</li>
                <li>All operating expenses ({expenses.length})</li>
                <li>All client payments and advances ({payments.length})</li>
                <li>All partner distributions, dividends, and loans ({distributions.length + loans.length})</li>
                <li>All journal entries and ledger logs ({transactions.length})</li>
                <li>Account balances will be reset to ₨ 0</li>
              </ul>
            </div>

            <p className="text-xs text-slate-400">
              Agency settings, user accounts, and partner profiles will remain intact. You will be left with a clean slate ready for fresh records.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-delete-all-btn"
                onClick={executeDeleteAll}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-lg shadow-rose-900/30 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting All...' : 'Yes, Delete All Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
