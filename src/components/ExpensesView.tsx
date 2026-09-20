import React, { useState, useMemo } from 'react';
import { Expense, Account, Partner } from '../types';
import { formatPKR, formatUSD, formatDate } from '../utils/formatters';
import { TrendingDown, Plus, Filter, Search, Tag, Building2, UserCheck, Eye, Edit2, Printer, X } from 'lucide-react';
import { api } from '../api';
import { EditableCombobox, ComboboxOption } from './EditableCombobox';

interface ExpensesViewProps {
  expenses: Expense[];
  accounts: Account[];
  partners: Partner[];
  onRefresh: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  accounts,
  partners,
  onRefresh
}) => {
  const [showModal, setShowModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Details/Receipt and Edit modal states
  const [viewingReceiptExpense, setViewingReceiptExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('software_tools');
  const [editAmount, setEditAmount] = useState<number>(5000);
  const [editCurrency, setEditCurrency] = useState<'PKR' | 'USD'>('PKR');
  const [editExchangeRate, setEditExchangeRate] = useState<number>(280);
  const [editAccountId, setEditAccountId] = useState<number>(1);
  const [editPaidByPartnerId, setEditPaidByPartnerId] = useState<number | ''>('');
  const [editVendor, setEditVendor] = useState('');
  const [editExpenseDate, setEditExpenseDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('software_tools');
  const [amountOriginal, setAmountOriginal] = useState<number>(5000);
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR');
  const [exchangeRate, setExchangeRate] = useState<number>(280);
  const [accountId, setAccountId] = useState<number>(accounts[0]?.id || 1);
  const [paidByPartnerId, setPaidByPartnerId] = useState<number | ''>('');
  const [vendor, setVendor] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [isReimbursable, setIsReimbursable] = useState(false);
  const [notes, setNotes] = useState('');

  const amountPkr = currency === 'USD' ? Math.round(amountOriginal * exchangeRate) : amountOriginal;

  const categories = [
    { id: 'software_tools', label: 'Software & Cloud Tools' },
    { id: 'office_rent', label: 'Office Rent & Facilities' },
    { id: 'utilities', label: 'Utilities & Internet' },
    { id: 'marketing', label: 'Advertising & Marketing' },
    { id: 'contractor_fees', label: 'Freelancer / Contractor Fees' },
    { id: 'client_entertainment', label: 'Client Hospitality & Dinner' },
    { id: 'travel', label: 'Travel & Transport' },
    { id: 'legal_tax', label: 'Legal & Professional Services' },
    { id: 'other', label: 'General / Miscellaneous' }
  ];

  // Combobox options derived from recorded expenses + standard agency operations
  const expenditureOptions: ComboboxOption[] = useMemo(() => {
    const map = new Map<string, ComboboxOption>();

    // 1. Existing recorded expenses in application
    for (const exp of expenses) {
      if (exp.title && !map.has(exp.title.trim().toLowerCase())) {
        map.set(exp.title.trim().toLowerCase(), {
          id: exp.id,
          label: exp.title,
          sublabel: exp.vendor ? `Vendor: ${exp.vendor} · ${exp.category.replace('_', ' ')}` : exp.category.replace('_', ' '),
          meta: exp
        });
      }
    }

    // 2. Standard agency operational expenditure suggestions
    const standardAgencyExpenses = [
      { label: 'Figma Team Subscription', category: 'software_tools', vendor: 'Figma Inc' },
      { label: 'Adobe Creative Cloud', category: 'software_tools', vendor: 'Adobe Systems' },
      { label: 'Google Workspace & Cloud Storage', category: 'software_tools', vendor: 'Google LLC' },
      { label: 'AWS / Vercel Cloud Hosting', category: 'software_tools', vendor: 'Amazon Web Services' },
      { label: 'Office Rent & Facilities', category: 'office_rent', vendor: 'Commercial Plaza Landlord' },
      { label: 'High-Speed Fiber Internet', category: 'utilities', vendor: 'Nayatel / PTCL' },
      { label: 'Office Electricity & Power Backup', category: 'utilities', vendor: 'IESCO / K-Electric' },
      { label: 'Meta & Google Ads Campaign', category: 'marketing', vendor: 'Meta Platforms' },
      { label: 'Freelance UI/UX Designer Contractor', category: 'contractor_fees', vendor: 'External Contractor' },
      { label: 'Freelance Fullstack Developer Contractor', category: 'contractor_fees', vendor: 'External Contractor' },
      { label: 'Client Dinner & Hospitality', category: 'client_entertainment', vendor: 'Hospitality / Restaurant' },
      { label: 'Corporate Legal & Tax Advisory', category: 'legal_tax', vendor: 'Legal Counsel' },
      { label: 'Office Pantry & Refreshments', category: 'other', vendor: 'Pantry Supplies' }
    ];

    for (const std of standardAgencyExpenses) {
      if (!map.has(std.label.toLowerCase())) {
        map.set(std.label.toLowerCase(), {
          label: std.label,
          sublabel: `Suggested · ${std.category.replace('_', ' ')}`,
          meta: std
        });
      }
    }

    return Array.from(map.values());
  }, [expenses]);

  const handleSelectExpenditure = (opt: ComboboxOption) => {
    setTitle(opt.label);
    if (opt.meta) {
      if (opt.meta.category) setCategory(opt.meta.category);
      if (opt.meta.vendor && !vendor) setVendor(opt.meta.vendor);
      if (opt.meta.currency) setCurrency(opt.meta.currency);
      if (opt.meta.amount_original && (!amountOriginal || amountOriginal === 150)) {
        setAmountOriginal(opt.meta.amount_original);
      }
    }
  };

  const filtered = expenses.filter(e => {
    const matchCat = filterCategory === 'all' || e.category === filterCategory;
    const matchSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.vendor && e.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      e.expense_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const pkrExpenses = useMemo(() => filtered.filter(e => (e.currency || 'PKR') === 'PKR'), [filtered]);
  const usdExpenses = useMemo(() => filtered.filter(e => e.currency === 'USD'), [filtered]);

  const totalPkrExpenses = useMemo(() => pkrExpenses.reduce((sum, e) => sum + (Number(e.amount_original || e.amount_pkr) || 0), 0), [pkrExpenses]);
  const totalUsdExpenses = useMemo(() => usdExpenses.reduce((sum, e) => sum + (Number(e.amount_original) || 0), 0), [usdExpenses]);

  const handleOpenEditExpense = (exp: Expense) => {
    setEditingExpense(exp);
    setEditTitle(exp.title || '');
    setEditCategory(exp.category || 'software_tools');
    setEditAmount(exp.amount_original || exp.amount_pkr || 0);
    setEditCurrency((exp.currency as 'PKR' | 'USD') || 'PKR');
    setEditExchangeRate(exp.exchange_rate || 280);
    setEditAccountId(exp.account_id || 1);
    setEditPaidByPartnerId(exp.paid_by_partner_id || '');
    setEditVendor(exp.vendor || '');
    setEditExpenseDate(exp.expense_date || '');
    setEditNotes(exp.notes || '');
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await api.updateExpense(editingExpense.id, {
        title: editTitle,
        category: editCategory,
        amount_original: Number(editAmount),
        currency: editCurrency,
        exchange_rate: editCurrency === 'USD' ? Number(editExchangeRate) : 1.0,
        account_id: editAccountId,
        paid_by_partner_id: editPaidByPartnerId ? Number(editPaidByPartnerId) : null,
        vendor: editVendor,
        expense_date: editExpenseDate,
        notes: editNotes
      });
      setSuccessMsg(`Expense ${editingExpense.expense_number} updated successfully.`);
      setEditingExpense(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !accountId || amountOriginal <= 0) {
      setErrorMsg('Title, payment account, and positive amount are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.recordExpense({
        title,
        category,
        amount_original: Number(amountOriginal),
        currency,
        exchange_rate: currency === 'USD' ? Number(exchangeRate) : 1.0,
        account_id: accountId,
        paid_by_partner_id: paidByPartnerId ? Number(paidByPartnerId) : null,
        vendor,
        expense_date: expenseDate,
        is_reimbursable: isReimbursable ? 1 : 0,
        notes
      });
      setSuccessMsg(`Expense ${res.expense_number} recorded successfully! Total: PKR ${res.amount_pkr.toLocaleString()}`);
      setShowModal(false);
      setTitle('');
      setVendor('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-400" />
            Operating Expenses & Outflows
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track agency operational costs with explicit partner attribution and account reconciliation. Excludes financing and equity distributions.
          </p>
        </div>

        <button
          id="add-expense-btn"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Expense
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

      {/* Dual Currency Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Operating Spent (PKR)</span>
          <div className="text-lg font-bold font-mono text-white">
            ₨ {totalPkrExpenses.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">{pkrExpenses.length} PKR expenses</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Operating Spent (USD)</span>
          <div className="text-lg font-bold font-mono text-rose-400">
            ${totalUsdExpenses.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">{usdExpenses.length} USD expenses</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Expenditure Records</span>
          <div className="text-lg font-bold font-mono text-slate-200">
            {filtered.length} Items
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Active filter: {filterCategory === 'all' ? 'All categories' : filterCategory.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="expense-search-input"
            type="text"
            placeholder="Search by title, vendor, or expense #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            id="expense-category-filter"
            aria-label="Filter by Expense Category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-rose-500"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* Expense Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Expense #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4">Title / Scope</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Currency</th>
                <th className="py-3 px-3">Vendor</th>
                <th className="py-3 px-3">Paid From / By</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filtered.map((e) => {
                const isUsd = e.currency === 'USD';
                return (
                  <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-300">
                      {e.expense_number}
                    </td>
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {formatDate(e.expense_date)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {e.title}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                        {e.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        isUsd ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {isUsd ? 'USD ($)' : 'PKR (₨)'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {e.vendor || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-300">{e.account_name}</div>
                      {e.paid_by_partner_id && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold inline-block mt-0.5 ${
                          e.paid_by_partner_id === 1 ? 'bg-blue-900/40 text-blue-300' : 'bg-purple-900/40 text-purple-300'
                        }`}>
                          Partner: {e.paid_by_partner_id === 1 ? 'Musaddiq' : 'Arshad'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium">
                      {isUsd ? (
                        <div>
                          <span className="text-rose-400 font-bold">${Number(e.amount_original).toLocaleString()}</span>
                          <span className="text-[10px] text-slate-500 block font-normal">(PKR {Math.round(e.amount_pkr).toLocaleString()})</span>
                        </div>
                      ) : (
                        <span className="font-bold text-white">₨ {Number(e.amount_original || e.amount_pkr).toLocaleString()}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingReceiptExpense(e)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="View Expense Details & Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditExpense(e)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-400" />
                Record Operating Expense
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">Expense Title / Item *</label>
                  <span className="text-[10px] text-slate-400">Type new name or select existing</span>
                </div>
                <EditableCombobox
                  id="expense-title-combobox"
                  value={title}
                  onChange={(val) => setTitle(val)}
                  onSelectOption={handleSelectExpenditure}
                  options={expenditureOptions}
                  placeholder="Type new expenditure name or select existing..."
                  required
                  createNewText="Use custom expenditure name"
                  emptyText="No matching expenditures found. You can enter and record this new expenditure directly."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Vendor / Payee</label>
                  <input
                    type="text"
                    placeholder="e.g., Adobe Inc."
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              {/* Currency & Amount */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Currency *</label>
                  <select
                    id="exp-currency-select"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="PKR">PKR — Pakistani Rupee (₨)</option>
                    <option value="USD">USD — US Dollar ($)</option>
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

              <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-300">Operating Cost Impact (PKR):</span>
                <span className="font-bold text-rose-400 text-sm font-mono">
                  {formatPKR(amountPkr)}
                </span>
              </div>

              {/* Payment Account & Partner Attribution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Paid From Account *</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.currency}) - Bal: {formatPKR(a.current_balance)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Paid Personally by Partner?</label>
                  <select
                    value={paidByPartnerId}
                    onChange={(e) => setPaidByPartnerId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="">No (Company Funded)</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Attributed to partner expenses</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Expense Date</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes / Invoice Ref</label>
                <input
                  type="text"
                  placeholder="e.g., Receipt #7890 approved by management"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is-reimbursable-check"
                  checked={isReimbursable}
                  onChange={(e) => setIsReimbursable(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-rose-500"
                />
                <label htmlFor="is-reimbursable-check" className="text-slate-300 font-medium cursor-pointer">
                  Partner Out-of-Pocket (Requires Company Reimbursement)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 font-bold text-white rounded-xl shadow-sm"
                >
                  {isSubmitting ? 'Recording...' : 'Book Expense'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXPENSE RECEIPT & DETAILS */}
      {viewingReceiptExpense && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-rose-400 uppercase">StryKon Expenditure Receipt</span>
                <h3 className="text-xl font-bold text-white font-mono mt-0.5">{viewingReceiptExpense.expense_number}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingReceiptExpense(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Expenditure / Scope:</span>
                <span className="text-white font-bold text-sm block mt-0.5">{viewingReceiptExpense.title}</span>
                <span className="text-slate-400 block mt-1">Vendor: {viewingReceiptExpense.vendor || 'N/A'}</span>
                <span className="text-slate-400 block">Date: {formatDate(viewingReceiptExpense.expense_date)}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block font-semibold">Currency:</span>
                <span className="text-rose-400 font-bold font-mono text-sm block mt-0.5">
                  {viewingReceiptExpense.currency === 'USD' ? 'USD — US Dollar ($)' : 'PKR — Pakistani Rupee (₨)'}
                </span>
                <span className="text-slate-400 block mt-1">Funding Account:</span>
                <span className="font-semibold text-white">
                  {viewingReceiptExpense.account_name}
                </span>
              </div>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300 border-b border-slate-700/70 pb-2 font-semibold">
                <span>Category</span>
                <span className="capitalize">{viewingReceiptExpense.category.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-sm pt-1">
                <span>Recorded Amount</span>
                <span className="font-mono text-rose-400">
                  {viewingReceiptExpense.currency === 'USD' ? `$${Number(viewingReceiptExpense.amount_original).toLocaleString()}` : `₨ ${Number(viewingReceiptExpense.amount_original || viewingReceiptExpense.amount_pkr).toLocaleString()}`}
                </span>
              </div>
              {viewingReceiptExpense.currency === 'USD' && (
                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span>PKR Equivalent (@{viewingReceiptExpense.exchange_rate})</span>
                  <span className="font-mono">₨ {Number(viewingReceiptExpense.amount_pkr).toLocaleString()}</span>
                </div>
              )}
              {viewingReceiptExpense.paid_by_partner_id && (
                <div className="flex justify-between text-[11px] text-purple-300 pt-1 border-t border-slate-700/70">
                  <span>Out of Pocket Attribution</span>
                  <span>{viewingReceiptExpense.paid_by_partner_id === 1 ? 'Musaddiq Mustafa' : 'Arshad Qazi'}</span>
                </div>
              )}
            </div>

            {viewingReceiptExpense.notes && (
              <div className="text-xs text-slate-400 bg-slate-800/30 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-slate-300 block mb-1">Notes / Invoice Ref:</span>
                {viewingReceiptExpense.notes}
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
                onClick={() => setViewingReceiptExpense(null)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT EXPENSE */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-400" />
                Edit Expense {editingExpense.expense_number}
              </h3>
              <button onClick={() => setEditingExpense(null)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleUpdateExpense} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Expenditure Name * (Type new or select)</label>
                <EditableCombobox
                  id="edit-expense-title-combobox"
                  value={editTitle}
                  onChange={(val) => setEditTitle(val)}
                  onSelectOption={(opt) => {
                    setEditTitle(opt.label);
                    if (opt.meta?.category) setEditCategory(opt.meta.category);
                    if (opt.meta?.vendor && !editVendor) setEditVendor(opt.meta.vendor);
                  }}
                  options={expenditureOptions}
                  placeholder="Type or select expenditure name..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Vendor / Payee</label>
                  <input
                    type="text"
                    value={editVendor}
                    onChange={(e) => setEditVendor(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Currency *</label>
                  <select
                    id="edit-exp-currency"
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value as 'PKR' | 'USD')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="PKR">PKR — Pakistani Rupee (₨)</option>
                    <option value="USD">USD — US Dollar ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Exchange Rate</label>
                  <input
                    type="number"
                    value={editExchangeRate}
                    disabled={editCurrency === 'PKR'}
                    onChange={(e) => setEditExchangeRate(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white disabled:opacity-50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Account *</label>
                  <select
                    value={editAccountId}
                    onChange={(e) => setEditAccountId(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.currency})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Paid By (Attribution)</label>
                  <select
                    value={editPaidByPartnerId}
                    onChange={(e) => setEditPaidByPartnerId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="">Company Bank / Treasury</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Partner)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={editExpenseDate}
                    onChange={(e) => setEditExpenseDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Notes / Ref</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-bold text-white rounded-xl shadow-sm"
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
