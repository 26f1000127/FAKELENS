import React, { useState } from 'react';
import { Bell, Menu, ArrowLeft, ChevronRight, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { PageId } from './Sidebar';

interface HeaderProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onMobileMenuToggle: () => void;
  subTitle?: string;
  onBack?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'success' | 'warning' | 'info';
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  onMobileMenuToggle,
  subTitle,
  onBack
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState<NotificationItem[]>([]);

  const getBreadcrumbs = () => {
    switch (currentPage) {
      case 'dashboard':
        return null;
      case 'new-audit':
        return (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
            <button
              onClick={onBack || (() => onNavigate('dashboard'))}
              className="p-1.5 rounded-xl bg-[#141A2B] hover:text-white border border-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-purple-500"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-200">
              Dashboard
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-white font-medium">{subTitle || 'New Audit'}</span>
          </div>
        );
      case 'brand-assets':
        return (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-1.5 rounded-xl bg-[#141A2B] hover:text-white border border-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-purple-500"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-200">
              Dashboard
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-white font-medium">Brand Assets</span>
          </div>
        );
      case 'guidelines':
        return (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-1.5 rounded-xl bg-[#141A2B] hover:text-white border border-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-purple-500"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-200">
              Dashboard
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-white font-medium">Guidelines</span>
          </div>
        );
      case 'audit-history':
        return (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-1.5 rounded-xl bg-[#141A2B] hover:text-white border border-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-purple-500"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-200">
              Dashboard
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-white font-medium">Audit History</span>
          </div>
        );
      case 'analytics':
        return (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-1.5 rounded-xl bg-[#141A2B] hover:text-white border border-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-purple-500"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-200">
              Dashboard
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-white font-medium">Analytics</span>
          </div>
        );
      case 'settings':
        return (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-1.5 rounded-xl bg-[#141A2B] hover:text-white border border-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-purple-500"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-200">
              Dashboard
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-white font-medium">Settings</span>
          </div>
        );
    }
  };

  return (
    <header className="h-16 border-b border-[#1A2238] bg-[#0A0D18]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-xl bg-[#141A2B] text-slate-300 hover:text-white border border-white/5 focus-visible:ring-2 focus-visible:ring-purple-500"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Breadcrumbs */}
        {getBreadcrumbs()}
      </div>

      {/* Right controls: Notifications & User profile */}
      <div className="flex items-center gap-3 relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#121727] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          title="Notifications"
          aria-label="View notifications"
        >
          <Bell className="w-5 h-5" />
          {notifications.length > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-500 ring-2 ring-[#0A0D18]" />
          )}
        </button>

        {/* Notification popover */}
        {showNotifications && (
          <div className="absolute right-10 top-12 w-80 rounded-3xl bg-[#121727] border border-white/10 shadow-2xl p-4 z-50 animate-fade-in space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Notifications ({notifications.length})
              </span>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="py-6 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-300">No notifications yet</p>
                <p className="text-[11px] text-slate-500">
                  Alerts and audit completion updates will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 rounded-2xl bg-[#0E1322] border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {n.type === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span className="text-xs font-semibold text-white">{n.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{n.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User avatar "V" with purple circle */}
        <button
          onClick={() => onNavigate('settings')}
          className="flex items-center gap-2 pl-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-full"
          title="Account Settings"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 p-[1.5px] shadow-sm shadow-purple-500/30">
            <div className="w-full h-full rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
              V
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};
