import React, { useState, useMemo } from 'react';
import { Expense, Account, Partner } from '../types';
import { formatPKR, formatUSD, formatDate } from '../utils/formatters';
import { TrendingDown, Plus, Filter, Search, Tag, Building2, UserCheck } from 'lucide-react';
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

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('software_tools');
  const [amountOriginal, setAmountOriginal] = useState<number>(150);
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('USD');
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

  const totalExpenseSum = filtered.reduce((acc, e) => acc + e.amount_pkr, 0);

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

          <span className="text-xs text-slate-400 pl-2 border-l border-slate-800">
            Total: <strong className="text-rose-400 font-mono">{formatPKR(totalExpenseSum)}</strong>
          </span>
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
                <th className="py-3 px-3">Vendor</th>
                <th className="py-3 px-3">Paid From / By</th>
                <th className="py-3 px-3 text-right">Original Amount</th>
                <th className="py-3 px-4 text-right">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filtered.map((e) => (
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
                    {e.currency === 'USD' ? (
                      <span className="text-rose-400 font-bold">
                        {formatUSD(e.amount_original)} <span className="text-[10px] text-slate-500">(@{e.exchange_rate})</span>
                      </span>
                    ) : (
                      formatPKR(e.amount_original)
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                    {formatPKR(e.amount_pkr)}
                  </td>
                </tr>
              ))}
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

    </div>
  );
};
