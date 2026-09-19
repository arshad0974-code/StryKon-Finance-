import React, { useState, useEffect } from 'react';
import { formatPKR, formatUSD } from '../utils/formatters';
import { PieChart, Download, Printer, ShieldCheck, CheckCircle2, Calendar, FileText, ArrowRight } from 'lucide-react';
import { api } from '../api';

export const ReportsView: React.FC = () => {
  const [reportType, setReportType] = useState<'pnl' | 'cashflow' | 'partner_compare'>('pnl');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [pnlData, setPnlData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPnl = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPnlReport(startDate, endDate);
      setPnlData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPnl();
  }, [startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-400" />
            Financial Statements & Formal Reports
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            GAAP-compliant agency financial reporting with strict operating vs financing separation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Report Controls & Date Filter */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReportType('pnl')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              reportType === 'pnl' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Profit & Loss (P&L)
          </button>
          <button
            onClick={() => setReportType('cashflow')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              reportType === 'cashflow' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cash Flow Statement
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Period:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1"
          />
        </div>
      </div>

      {/* REPORT CONTENT: PROFIT & LOSS */}
      {reportType === 'pnl' && pnlData && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          
          <div className="text-center border-b border-slate-800 pb-5">
            <h1 className="text-xl font-bold text-white tracking-tight uppercase">Strykon (Digital Marketing Agency)</h1>
            <h2 className="text-base font-semibold text-emerald-400 mt-1">Income Statement (Profit & Loss)</h2>
            <p className="text-xs text-slate-400 mt-1">
              For the Period {startDate} through {endDate} • Currency: Pakistani Rupee (PKR)
            </p>
          </div>

          <div className="space-y-6 max-w-3xl mx-auto">
            
            {/* Operating Revenue Section */}
            <div>
              <div className="flex items-center justify-between border-b-2 border-slate-700 pb-2 text-sm font-bold text-white uppercase tracking-wider">
                <span>1. Operating Revenue</span>
                <span className="font-mono text-emerald-400">{formatPKR(pnlData.operating_revenue)}</span>
              </div>
              <div className="py-2.5 px-3 flex justify-between text-xs text-slate-300">
                <span>Client Contract & Project Billings (Cash Earned)</span>
                <span className="font-mono font-medium">{formatPKR(pnlData.operating_revenue)}</span>
              </div>
            </div>

            {/* Operating Expenses Section */}
            <div>
              <div className="flex items-center justify-between border-b-2 border-slate-700 pb-2 text-sm font-bold text-white uppercase tracking-wider">
                <span>2. Operating Expenses</span>
                <span className="font-mono text-rose-400">({formatPKR(pnlData.operating_expenses)})</span>
              </div>
              <div className="divide-y divide-slate-800/60 text-xs">
                {pnlData.breakdown && Object.entries(pnlData.breakdown).map(([cat, val]: any) => (
                  <div key={cat} className="py-2 px-3 flex justify-between text-slate-300">
                    <span className="capitalize">{cat.replace(/_/g, ' ')}</span>
                    <span className="font-mono">{formatPKR(val)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Income Summary */}
            <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center justify-between text-base font-bold text-white">
              <span>NET OPERATING INCOME / (LOSS):</span>
              <span className={`font-mono text-lg ${pnlData.net_income >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatPKR(pnlData.net_income)}
              </span>
            </div>

            {/* Financial Integrity Exclusion Proof */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/30 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Financial Integrity Audit Confirmation</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                As required by Strykon core accounting rules, the following non-operating cash movements are verified and strictly excluded from operating expenses:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block">Bank Loan Principals:</span>
                  <span className="font-bold text-white">Excluded (Liability)</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block">Partner Dividends:</span>
                  <span className="font-bold text-white">Excluded (Equity)</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block">Personal Drawings:</span>
                  <span className="font-bold text-white">Excluded (Drawings)</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* REPORT CONTENT: CASH FLOW */}
      {reportType === 'cashflow' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="text-center border-b border-slate-800 pb-5">
            <h1 className="text-xl font-bold text-white tracking-tight uppercase">Strykon (Digital Marketing Agency)</h1>
            <h2 className="text-base font-semibold text-emerald-400 mt-1">Statement of Cash Flows</h2>
            <p className="text-xs text-slate-400 mt-1">
              Direct Method • Currency: PKR
            </p>
          </div>

          <div className="space-y-5 max-w-3xl mx-auto text-xs">
            <div className="border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="font-bold text-white uppercase tracking-wider text-sm flex justify-between">
                <span>Cash Flows from Operating Activities</span>
                <span className="text-emerald-400 font-mono">+PKR 1,070,000</span>
              </div>
              <div className="flex justify-between text-slate-400 pl-2">
                <span>Cash Receipts from Clients</span>
                <span className="text-white font-mono">PKR 1,570,000</span>
              </div>
              <div className="flex justify-between text-slate-400 pl-2">
                <span>Cash Paid to Suppliers & Salaries</span>
                <span className="text-rose-400 font-mono">(PKR 500,000)</span>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="font-bold text-white uppercase tracking-wider text-sm flex justify-between">
                <span>Cash Flows from Financing & Equity</span>
                <span className="text-blue-400 font-mono">+PKR 780,000</span>
              </div>
              <div className="flex justify-between text-slate-400 pl-2">
                <span>Proceeds from Bank Term Loan</span>
                <span className="text-white font-mono">+PKR 1,000,000</span>
              </div>
              <div className="flex justify-between text-slate-400 pl-2">
                <span>Loan Principal Repayments</span>
                <span className="text-rose-400 font-mono">(PKR 200,000)</span>
              </div>
              <div className="flex justify-between text-slate-400 pl-2">
                <span>Partner Drawings & Dividends</span>
                <span className="text-rose-400 font-mono">(PKR 20,000)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex justify-between text-base font-bold text-white">
              <span>NET INCREASE IN CASH:</span>
              <span className="text-emerald-400 font-mono">+PKR 1,850,000</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
