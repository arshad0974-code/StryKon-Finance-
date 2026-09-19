import React, { useState } from 'react';
import { User, NotificationItem } from '../types';
import { Bell, RefreshCw, UserCheck, Shield, CheckCircle, AlertTriangle, Info, Clock, DollarSign } from 'lucide-react';
import { setApiAuth } from '../api';

interface HeaderProps {
  currentUser: User;
  users: User[];
  onUserChange: (user: User) => void;
  notifications: NotificationItem[];
  onNotificationRead: (id: number) => void;
  onRefresh: () => void;
  selectedPartnerFilter: number | null;
  onPartnerFilterChange: (partnerId: number | null) => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  onUserChange,
  notifications,
  onNotificationRead,
  onRefresh,
  selectedPartnerFilter,
  onPartnerFilterChange,
  isRefreshing
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleRoleSelect = (u: User) => {
    setApiAuth(u.role, u.username);
    onUserChange(u);
  };

  return (
    <header id="app-header" className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-xl tracking-wider shadow-sm">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">STRYKON</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30">
                  Finance OS
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>Base: <strong>PKR</strong></span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center text-emerald-400">
                  <DollarSign className="w-3 h-3 inline" /> 1 USD = 280 PKR
                </span>
              </div>
            </div>
          </div>

          {/* Partner Ledger Filter */}
          {currentUser.role === 'admin' ? (
            <div className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
              <span className="px-2 text-slate-400 font-medium">Ledger View:</span>
              <button
                id="filter-all-agency"
                onClick={() => onPartnerFilterChange(null)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  selectedPartnerFilter === null
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                Consolidated Agency
              </button>
              <button
                id="filter-musaddiq"
                onClick={() => onPartnerFilterChange(1)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  selectedPartnerFilter === 1
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                Musaddiq Mustafa
              </button>
              <button
                id="filter-arshad"
                onClick={() => onPartnerFilterChange(2)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  selectedPartnerFilter === 2
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                Arshad Qazi
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
              <span className="text-slate-400 font-medium">Partner Portal:</span>
              <span className="text-emerald-400 font-semibold">{currentUser.full_name}</span>
              <span className="text-[10px] bg-slate-700/80 text-slate-300 px-1.5 py-0.5 rounded">50% Equity</span>
            </div>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            
            {/* Refresh Data Button */}
            <button
              id="refresh-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh financial data from database"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800 relative"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                id="notification-bell-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800 relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                    <span className="text-sm font-semibold text-white">Notifications & Alerts</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {unreadCount} unread
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications at this time.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs transition-colors ${
                            n.is_read ? 'bg-slate-900/40 text-slate-400' : 'bg-slate-800/40 text-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              {n.type === 'overdue' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                              {n.type === 'warning' && <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                              {n.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
                              {n.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                              <div>
                                <p className="font-medium text-white">{n.title}</p>
                                <p className="mt-0.5 text-slate-300 leading-relaxed">{n.message}</p>
                              </div>
                            </div>
                            {!n.is_read && (
                              <button
                                onClick={() => onNotificationRead(n.id)}
                                className="text-[11px] text-emerald-400 hover:text-emerald-300 shrink-0 font-medium"
                              >
                                Dismiss
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Active User / Role Switcher */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs">
                {currentUser.full_name.charAt(0)}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-white leading-tight">{currentUser.full_name}</div>
                <div className="text-[10px] text-slate-400 capitalize flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-emerald-400 inline" />
                  {currentUser.role}
                </div>
              </div>
              <select
                id="role-switcher-select"
                aria-label="Switch User or Role"
                value={currentUser.id}
                onChange={(e) => {
                  const target = users.find(u => u.id === Number(e.target.value));
                  if (target) handleRoleSelect(target);
                }}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
