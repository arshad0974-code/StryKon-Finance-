import React, { useState } from 'react';
import { Employee, Payroll, Account } from '../types';
import { formatPKR, formatDate } from '../utils/formatters';
import { Users, Plus, CheckCircle, Clock, Gift, Award, DollarSign } from 'lucide-react';
import { api } from '../api';

interface PayrollViewProps {
  employees: Employee[];
  payroll: Payroll[];
  accounts: Account[];
  onRefresh: () => void;
}

export const PayrollView: React.FC<PayrollViewProps> = ({
  employees,
  payroll,
  accounts,
  onRefresh
}) => {
  const [subTab, setSubTab] = useState<'payroll' | 'employees'>('payroll');
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Payroll form state
  const [payEmpId, setPayEmpId] = useState<number>(employees[0]?.id || 1);
  const [payMonth, setPayMonth] = useState('2026-09');
  const [payBase, setPayBase] = useState<number>(employees[0]?.base_salary_pkr || 95000);
  const [payBonus, setPayBonus] = useState<number>(0);
  const [payDeductions, setPayDeductions] = useState<number>(0);
  const [payAccountId, setPayAccountId] = useState<number>(accounts[0]?.id || 1);
  const [payStatus, setPayStatus] = useState<'paid' | 'pending'>('paid');
  const [payNotes, setPayNotes] = useState('');

  // Employee form state
  const [empName, setEmpName] = useState('');
  const [empDesignation, setEmpDesignation] = useState('Performance Marketing Specialist');
  const [empDepartment, setEmpDepartment] = useState('Marketing');
  const [empSalary, setEmpSalary] = useState(100000);
  const [empEmail, setEmpEmail] = useState('');

  const netSalary = Number(payBase) + Number(payBonus) - Number(payDeductions);

  const handleRunPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payEmpId || !payAccountId || netSalary <= 0) {
      setErrorMsg('Employee, payment account, and valid net salary required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.recordPayroll({
        employee_id: payEmpId,
        month_year: payMonth,
        base_salary: Number(payBase),
        bonus: Number(payBonus),
        deductions: Number(payDeductions),
        account_id: payAccountId,
        payment_date: payStatus === 'paid' ? new Date().toISOString().split('T')[0] : null,
        status: payStatus,
        notes: payNotes
      });
      setSuccessMsg(`Payroll entry ${res.payroll_number} processed for ${formatPKR(res.net_salary)}!`);
      setShowPayrollModal(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process payroll');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || empSalary <= 0) {
      setErrorMsg('Name and positive base salary are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createEmployee({
        full_name: empName,
        designation: empDesignation,
        department: empDepartment,
        base_salary_pkr: Number(empSalary),
        email: empEmail,
        joining_date: new Date().toISOString().split('T')[0]
      });
      setSuccessMsg('Employee profile enrolled into Strykon payroll successfully.');
      setShowEmployeeModal(false);
      setEmpName('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add employee');
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
            <Users className="w-5 h-5 text-purple-400" />
            Payroll, Salaries & Employee Bonuses
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete agency workforce compensation engine. Tracks base salaries, performance bonuses, and deductions with direct bank ledger integration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="run-payroll-btn"
            onClick={() => setShowPayrollModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-sm"
          >
            <DollarSign className="w-4 h-4" />
            Process Salary / Bonus
          </button>
          <button
            id="add-employee-btn"
            onClick={() => setShowEmployeeModal(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Employee
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

      {/* Subtab Switches */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setSubTab('payroll')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            subTab === 'payroll' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Payroll Records ({payroll.length})
        </button>
        <button
          onClick={() => setSubTab('employees')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            subTab === 'employees' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Employee Directory ({employees.length})
        </button>
      </div>

      {/* PAYROLL LIST */}
      {subTab === 'payroll' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Payroll #</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-3">Period</th>
                  <th className="py-3 px-3 text-right">Base Salary</th>
                  <th className="py-3 px-3 text-right">Bonus</th>
                  <th className="py-3 px-3 text-right">Deductions</th>
                  <th className="py-3 px-4 text-right">Net Salary</th>
                  <th className="py-3 px-3">Disbursed From</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {payroll.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-300">
                      {p.payroll_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{p.employee_name}</div>
                      <div className="text-[10px] text-slate-400">{p.designation} • {p.department}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-mono">
                      {p.month_year}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {formatPKR(p.base_salary)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400">
                      {p.bonus > 0 ? `+${formatPKR(p.bonus)}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-400">
                      {p.deductions > 0 ? `-${formatPKR(p.deductions)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {formatPKR(p.net_salary)}
                    </td>
                    <td className="py-3 px-3 text-slate-300 text-[11px]">
                      {p.account_name || 'Accounts Payable'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMPLOYEES DIRECTORY */}
      {subTab === 'employees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div key={emp.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">{emp.full_name}</h3>
                  <p className="text-xs text-slate-400">{emp.designation}</p>
                </div>
                <span className="font-mono text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {emp.employee_code}
                </span>
              </div>

              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-semibold text-white">{emp.department}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Base Salary:</span>
                  <span className="font-bold text-emerald-400 font-mono">{formatPKR(emp.base_salary_pkr)}/mo</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Joined:</span>
                  <span>{formatDate(emp.joining_date)}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>{emp.email || 'No email registered'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400">
                  {emp.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RUN PAYROLL MODAL */}
      {showPayrollModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-400" />
              Process Employee Salary & Bonus
            </h3>
            <form onSubmit={handleRunPayroll} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Employee *</label>
                <select
                  value={payEmpId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setPayEmpId(id);
                    const emp = employees.find(m => m.id === id);
                    if (emp) setPayBase(emp.base_salary_pkr);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name} ({e.designation})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Period (YYYY-MM)</label>
                  <input
                    type="month"
                    value={payMonth}
                    onChange={(e) => setPayMonth(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={payStatus}
                    onChange={(e) => setPayStatus(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="paid">Disburse Immediately (Paid)</option>
                    <option value="pending">Book as Payable (Pending)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Base (PKR)</label>
                  <input
                    type="number"
                    value={payBase}
                    onChange={(e) => setPayBase(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bonus</label>
                  <input
                    type="number"
                    value={payBonus}
                    onChange={(e) => setPayBonus(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Deductions</label>
                  <input
                    type="number"
                    value={payDeductions}
                    onChange={(e) => setPayDeductions(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-950/40 border border-purple-800/40 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-300">Net Salary to Disburse:</span>
                <span className="font-bold text-purple-400 text-sm font-mono">
                  {formatPKR(netSalary)}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Bank Account</label>
                <select
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.currency}) - Bal: {formatPKR(a.current_balance)}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowPayrollModal(false)} className="px-4 py-2 text-slate-400">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 font-bold text-white rounded-xl">
                  {isSubmitting ? 'Processing...' : 'Disburse Salary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Enroll New Employee</h3>
            <form onSubmit={handleAddEmployee} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="e.g., Ayesha Farooq"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Designation</label>
                  <input
                    type="text"
                    value={empDesignation}
                    onChange={(e) => setEmpDesignation(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={empDepartment}
                    onChange={(e) => setEmpDepartment(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Base Salary (PKR/mo)</label>
                  <input
                    type="number"
                    value={empSalary}
                    onChange={(e) => setEmpSalary(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Work Email</label>
                  <input
                    type="email"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    placeholder="emp@strykon.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowEmployeeModal(false)} className="px-4 py-2 text-slate-400">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 font-bold text-white rounded-xl">
                  {isSubmitting ? 'Saving...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
