import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  BookMarked,
  Clock,
  BarChart2,
  Settings,
  Users,
  X
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'new-audit'
  | 'brand-assets'
  | 'guidelines'
  | 'audit-history'
  | 'analytics'
  | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  mobileOpen = false,
  onMobileClose
}) => {
  const navItems = [
    { id: 'dashboard' as PageId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-audit' as PageId, label: 'New Audit', icon: Sparkles },
    { id: 'brand-assets' as PageId, label: 'Brand Assets', icon: BookOpen },
    { id: 'guidelines' as PageId, label: 'Guidelines', icon: BookMarked },
    { id: 'audit-history' as PageId, label: 'Audit History', icon: Clock },
    { id: 'analytics' as PageId, label: 'Analytics', icon: BarChart2 },
    { id: 'settings' as PageId, label: 'Settings', icon: Settings }
  ];

  const handleNavClick = (page: PageId) => {
    onNavigate(page);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#0A0D18] border-r border-[#1B2236] z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar navigation"
      >
        {/* Top: Brand Header */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <button
              className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-xl"
              onClick={() => handleNavClick('dashboard')}
            >
              {/* Veryfi stylized ribbon logo mark */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-violet-400 p-[1.5px] shadow-lg shadow-purple-500/25 flex items-center justify-center">
                <div className="w-full h-full bg-[#0E1322] rounded-[10px] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                    <path
                      d="M4 6L11 20L15 12L8 4L4 6Z"
                      fill="url(#grad1)"
                    />
                    <path
                      d="M11 20L20 4L15 12L11 20Z"
                      fill="url(#grad2)"
                    />
                    <defs>
                      <linearGradient id="grad1" x1="4" y1="4" x2="15" y2="20" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#9333EA" />
                        <stop offset="1" stopColor="#6366F1" />
                      </linearGradient>
                      <linearGradient id="grad2" x1="11" y1="20" x2="20" y2="4" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#6366F1" />
                        <stop offset="1" stopColor="#A855F7" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-xl tracking-tight text-white">Veryfi</span>
                  <span className="font-extrabold text-xl tracking-tight text-purple-400">AI</span>
                </div>
                <p className="text-[10px] text-slate-400 tracking-wider">AI Brand Governance Platform</p>
              </div>
            </button>

            {/* Mobile close button */}
            <button
              onClick={onMobileClose}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg focus-visible:ring-2 focus-visible:ring-purple-500"
              aria-label="Close navigation sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5" aria-label="Main menu">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-700/80 to-indigo-600/80 text-white shadow-lg shadow-purple-900/30 border border-purple-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121727]'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'text-white scale-105' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Team Workspace Card */}
        <div className="p-4">
          <div className="bg-[#121727] border border-white/5 rounded-3xl p-3 flex items-center gap-3 hover:border-purple-500/20 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Workspace</p>
              <p className="text-sm font-semibold text-white truncate">Team (Local)</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
