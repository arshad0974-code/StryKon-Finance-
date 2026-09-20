import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  DollarSign,
  TrendingDown,
  Building2,
  UserCheck2,
  Briefcase,
  Landmark,
  PieChart,
  CheckCircle2,
  Settings,
  History
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'ledger'
  | 'clients_invoices'
  | 'payments'
  | 'expenses'
  | 'accounts'
  | 'partners'
  | 'payroll'
  | 'loans_distributions'
  | 'reports'
  | 'history'
  | 'checklist'
  | 'settings';

interface NavigationProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  overdueCount: number;
  userRole?: 'admin' | 'partner';
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange, overdueCount, userRole = 'admin' }) => {
  const allNavItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ledger' as TabType, label: 'Central Ledger', icon: BookOpen },
    { id: 'clients_invoices' as TabType, label: 'Clients & Invoices', icon: FileText, badge: overdueCount > 0 ? `${overdueCount} Overdue` : undefined },
    { id: 'payments' as TabType, label: 'Client Payments', icon: DollarSign },
    { id: 'expenses' as TabType, label: 'Expenses', icon: TrendingDown },
    { id: 'accounts' as TabType, label: 'Bank & Accounts', icon: Landmark },
    { id: 'partners' as TabType, label: 'Partner Ledgers', icon: UserCheck2 },
    { id: 'payroll' as TabType, label: 'Payroll & Staff', icon: Users, adminOnly: true },
    { id: 'loans_distributions' as TabType, label: 'Loans & Dividends', icon: Building2 },
    { id: 'reports' as TabType, label: 'Financial Reports', icon: PieChart },
    { id: 'history' as TabType, label: 'Previous Data', icon: History },
    { id: 'checklist' as TabType, label: 'Acceptance 14/14', icon: CheckCircle2, highlight: true },
    { id: 'settings' as TabType, label: 'Settings & Audit', icon: Settings, adminOnly: true },
  ];

  const navItems = allNavItems.filter(item => !item.adminOnly || userRole === 'admin');

  return (
    <nav className="bg-slate-900/90 border-b border-slate-800 text-slate-300 px-4">
      <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-2 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-600/90 text-white shadow-sm font-semibold'
                  : item.highlight
                  ? 'text-emerald-400 hover:bg-slate-800/80 hover:text-emerald-300'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
