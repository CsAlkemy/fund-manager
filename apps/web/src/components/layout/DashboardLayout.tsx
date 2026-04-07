import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n/useTranslation';
import { Logo } from '@/components/ui/Logo';

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
        <div className="flex items-center gap-2">
          <Logo size={24} withBg />
          <h1 className="text-lg font-bold text-white">{t('common.appTitle')}</h1>
        </div>
      </header>

      <Sidebar
        user={user}
        onLogout={logout}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Bottom nav for mobile */}
      <BottomNav user={user} onMoreClick={() => setSidebarOpen(true)} />

      <main className={`transition-all duration-200 ${collapsed ? 'md:ml-[68px]' : 'md:ml-60'}`}>
        <div className="p-4 pt-20 pb-28 md:p-8 md:pt-8 md:pb-8">{children}</div>
      </main>
    </div>
  );
}
