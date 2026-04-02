import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n/useTranslation';
import { Menu } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, logout } = useAuth();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center h-14 px-4 bg-sidebar-bg">
        <button onClick={() => setSidebarOpen(true)} className="text-white p-2 -ml-2" aria-label="Open menu">
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="ml-3 text-lg font-bold text-white">
          <span className="text-brand-accent">✦</span> {t('common.appTitle')}
        </h1>
      </header>

      <Sidebar
        user={user}
        onLogout={logout}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      <main className={`transition-all duration-200 ${collapsed ? 'md:ml-[68px]' : 'md:ml-60'}`}>
        <div className="p-4 pt-20 md:p-8 md:pt-8">{children}</div>
      </main>
    </div>
  );
}
