import { ReactNode, useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useGroup } from '@/hooks/useGroup';
import { useTranslation } from '@/i18n/useTranslation';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, logout } = useAuth();
  const { selectedGroupId, selectedMembership, setSelectedGroupId } = useGroup();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });
  const [showMobileGroupSelect, setShowMobileGroupSelect] = useState(false);
  const mobileGroupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (mobileGroupRef.current && !mobileGroupRef.current.contains(e.target as Node)) {
        setShowMobileGroupSelect(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSuperAdmin = user?.systemRole === 'SUPER_ADMIN';
  const memberships = user?.memberships || [];
  const hasMultipleGroups = memberships.length > 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-14 px-4 bg-sidebar-bg">
        <div className="flex items-center gap-2">
          <Logo size={24} withBg />
          <h1 className="text-lg font-bold text-white">{t('common.appTitle')}</h1>
        </div>

        {/* Mobile group switcher */}
        {!isSuperAdmin && memberships.length > 0 && (
          <div className="relative" ref={mobileGroupRef}>
            <button
              onClick={() => hasMultipleGroups && setShowMobileGroupSelect(!showMobileGroupSelect)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors',
                hasMultipleGroups ? 'hover:bg-white/10 active:bg-white/15' : '',
                showMobileGroupSelect && 'bg-white/10'
              )}
            >
              <Avatar
                src={selectedMembership?.group.logoUrl}
                name={selectedMembership?.group.name || ''}
                size="xs"
                shape="rounded"
                className="bg-white/20"
              />
              <span className="text-xs font-medium text-white/90 max-w-[100px] truncate">
                {selectedMembership?.group.name}
              </span>
              {hasMultipleGroups && (
                <ChevronDown className={cn('w-3 h-3 text-white/50 transition-transform', showMobileGroupSelect && 'rotate-180')} />
              )}
            </button>

            {showMobileGroupSelect && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('nav.switchGroup')}</p>
                {memberships.map((m) => (
                  <button
                    key={m.group.id}
                    onClick={() => { setSelectedGroupId(m.group.id); setShowMobileGroupSelect(false); }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                      m.group.id === selectedGroupId
                        ? 'bg-brand-primary/5 text-brand-primary'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <Avatar src={m.group.logoUrl} name={m.group.name} size="sm" shape="rounded" className={m.group.id === selectedGroupId ? 'bg-brand-primary' : 'bg-gray-400'} />
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-sm font-medium truncate">{m.group.name}</p>
                      <p className="text-[10px] text-gray-400">{m.role === 'MANAGER' ? t('role.manager') : t('role.member')}</p>
                    </div>
                    {m.group.id === selectedGroupId && (
                      <span className="text-[10px] font-medium text-brand-primary">{t('common.current')}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      {!loading && (
        <>
          <Sidebar
            user={user}
            onLogout={logout}
            mobileOpen={sidebarOpen}
            onMobileClose={() => setSidebarOpen(false)}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
          />
          <BottomNav user={user} onLogout={logout} />
        </>
      )}

      <main className={`transition-all duration-200 ${!loading && collapsed ? 'md:ml-[68px]' : !loading ? 'md:ml-60' : ''}`}>
        <div className="p-4 pt-20 pb-32 md:p-8 md:pt-8 md:pb-8">
          {loading ? <LoadingOverlay /> : children}
        </div>
      </main>
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-white/70 backdrop-blur-md">
      <LoadingSpinner size={100} />
    </div>
  );
}
