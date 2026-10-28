import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, PageId } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { BackendStatusBanner } from './components/common/BackendStatusBanner';
import { Toast, ToastType } from './components/common/Toast';
import { Dashboard } from './pages/Dashboard';
import { NewAudit } from './pages/NewAudit';
import { BrandAssets } from './pages/BrandAssets';
import { BrandGuidelines } from './pages/BrandGuidelines';
import { AuditHistory } from './pages/AuditHistory';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { AuditItem } from './types';
import { INITIAL_AUDITS } from './data/mockData';

const VALID_PAGES: PageId[] = [
  'dashboard',
  'new-audit',
  'brand-assets',
  'guidelines',
  'audit-history',
  'analytics',
  'settings'
];

export const App: React.FC = () => {
  // Sync initial page with URL hash
  const getPageFromHash = (): PageId => {
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase() as PageId;
    return VALID_PAGES.includes(hash) ? hash : 'dashboard';
  };

  const [currentPage, setCurrentPage] = useState<PageId>(getPageFromHash);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<AuditItem | null>(INITIAL_AUDITS[0]);

  // Toast state
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
    isOpen: false,
    message: '',
    type: 'success'
  });

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ isOpen: true, message, type });
  }, []);

  // Synchronize browser history & back/forward buttons
  const navigateTo = useCallback((page: PageId) => {
    setCurrentPage(page);
    window.location.hash = `#/${page}`;
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const page = getPageFromHash();
      setCurrentPage(page);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    // Ensure initial hash is set
    if (!window.location.hash) {
      window.location.hash = '#/dashboard';
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const handleSelectAudit = useCallback((audit: AuditItem) => {
    setSelectedAudit(audit);
    navigateTo('new-audit');
  }, [navigateTo]);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={navigateTo}
            onSelectAudit={handleSelectAudit}
          />
        );
      case 'new-audit':
        return (
          <NewAudit
            selectedAudit={selectedAudit}
            onShowToast={showToast}
          />
        );
      case 'brand-assets':
        return <BrandAssets onShowToast={showToast} />;
      case 'guidelines':
        return <BrandGuidelines onShowToast={showToast} />;
      case 'audit-history':
        return (
          <AuditHistory
            onOpenAudit={handleSelectAudit}
          />
        );
      case 'analytics':
        return <Analytics onShowToast={showToast} />;
      case 'settings':
        return <Settings onShowToast={showToast} />;
      default:
        return (
          <Dashboard
            onNavigate={navigateTo}
            onSelectAudit={handleSelectAudit}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D18] text-[#F8FAFC] flex flex-col selection:bg-purple-600 selection:text-white">
      {/* Top Banner explaining decoupled frontend mode */}
      <BackendStatusBanner />

      <div className="flex flex-1 relative overflow-x-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={navigateTo}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <Header
            currentPage={currentPage}
            onNavigate={navigateTo}
            onMobileMenuToggle={() => setMobileMenuOpen(true)}
            subTitle={currentPage === 'new-audit' ? 'Audit Results' : undefined}
          />

          <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
            {renderCurrentPage()}
          </main>
        </div>
      </div>

      {/* Global Toast Notification */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default App;
