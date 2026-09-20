import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { formatDate } from '../utils/formatters';
import { Settings, ShieldAlert, History, Download, DollarSign, Database, KeyRound, CheckCircle, RotateCcw } from 'lucide-react';
import { api } from '../api';

export const SettingsView: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [defaultRate, setDefaultRate] = useState('280');
  const [agencyName, setAgencyName] = useState('Strykon');
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
      const settings = await api.getSettings();
      if (settings.default_usd_to_pkr_rate) setDefaultRate(settings.default_usd_to_pkr_rate);
      if (settings.agency_name) setAgencyName(settings.agency_name);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateSettings({
        default_usd_to_pkr_rate: defaultRate,
        agency_name: agencyName
      });
      setSuccessMsg('Settings updated successfully. Note that existing transaction exchange rates remain securely locked.');
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToBlank = async () => {
    if (!confirm('Are you sure you want to reset the database to a completely blank financial state? All operational records (payments, invoices, expenses, transactions) will be cleared. Base accounts, agency settings, and partner equity will remain initialized.')) {
      return;
    }
    setIsResetting(true);
    setErrorMsg('');
    try {
      await api.resetBlankDatabase();
      setSuccessMsg('Financial database successfully reset to clean blank state. Reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset database');
    } finally {
      setIsResetting(false);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      agency: agencyName,
      exported_at: new Date().toISOString(),
      audit_count: auditLogs.length,
      note: 'Strykon Finance OS Relational Snapshot'
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strykon_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* MANDATORY QUALIFIED ACCOUNTANT COMPLIANCE DISCLAIMER */}
      <div className="bg-amber-950/40 border border-amber-600/40 rounded-2xl p-5 shadow-sm text-amber-200 space-y-2">
        <div className="flex items-center gap-2.5 font-bold text-amber-400 text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>Accounting & Legal Compliance Disclaimer</span>
        </div>
        <p className="text-xs text-amber-200/90 leading-relaxed">
          <strong>Mandatory Notice:</strong> Before using the app for official accounting, tax filings, or financial statements, have the accounting classifications and reporting rules reviewed by a qualified accountant.
        </p>
      </div>

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

      {/* Agency & Currency Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-400" />
              Agency & Currency Configuration
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Core agency settings and multi-currency exchange rate conventions.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="./strykon-finance.html"
              download="strykon-finance.html"
              id="download-standalone-html-btn"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download Standalone HTML (.html)
            </a>
            <button
              id="reset-db-btn"
              onClick={handleResetToBlank}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs font-semibold transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              Reset to Blank DB
            </button>
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              Download DB Snapshot
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Agency Name</label>
            <input
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Base Currency</label>
              <input
                type="text"
                disabled
                value="PKR (Pakistani Rupee)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-400 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Default 1 USD = PKR Rate</label>
              <input
                type="number"
                value={defaultRate}
                onChange={(e) => setDefaultRate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-[11px] text-slate-300">
            <strong>Historical Integrity Rule:</strong> Changing the default USD/PKR rate applies only to new transactions. All existing transactions retain their locked historical exchange rate.
          </div>

          <div>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-xl shadow-sm"
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>

      {/* Immutable Audit Trail */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Immutable Financial Audit Trail</h3>
          </div>
          <span className="text-xs text-slate-400">{auditLogs.length} logged events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Entity</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">User</th>
                <th className="py-3 px-4">Reason / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">
                      {log.entity_type} #{log.entity_id}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-400' :
                        log.action === 'UPDATE' ? 'bg-blue-500/10 text-blue-400' :
                        log.action === 'REVERSE' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-300">
                      {log.changed_by}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-sm truncate" title={log.reason || log.new_values}>
                      {log.reason || log.new_values || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
