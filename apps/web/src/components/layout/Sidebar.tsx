import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/cn';
import { User } from '@/hooks/useAuth';
import {
  LayoutDashboard, Shield, Users, FileText, Settings,
  Globe, CheckCircle, AlertTriangle, Wallet, UserCircle, Receipt,
  X, ChevronsLeft, ChevronsRight, LogOut, ChevronUp, Languages,
} from 'lucide-react';
import { ComponentType, useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  grid: LayoutDashboard,
  shield: Shield,
  users: Users,
  'file-text': FileText,
  settings: Settings,
  globe: Globe,
  check: CheckCircle,
  'alert-circle': AlertTriangle,
  wallet: Wallet,
  receipt: Receipt,
  user: UserCircle,
};

function NavItem({ href, icon, label, isActive, collapsed, onClick }: {
  href: string; icon: string; label: string; isActive: boolean; collapsed: boolean; onClick?: () => void;
}) {
  const Icon = iconMap[icon];
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg mb-0.5 text-sm transition-colors',
        collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
        isActive
          ? 'bg-sidebar-active text-sidebar-text-active font-medium'
          : 'text-sidebar-text hover:text-sidebar-text-active hover:bg-white/5'
      )}
    >
      {Icon && <Icon className="w-[18px] h-[18px] shrink-0" />}
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return <div className="my-3 mx-2 border-t border-white/10" />;
  return <p className="px-3 mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-sidebar-text/50">{label}</p>;
}

export function Sidebar({ user, onLogout, mobileOpen = false, onMobileClose, collapsed, onToggleCollapse }: SidebarProps) {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();
  const isSuperAdmin = user?.systemRole === 'SUPER_ADMIN';
  const isManager = !isSuperAdmin && (user?.memberships?.some((m) => m.role === 'MANAGER') || false);
  const isMember = !isSuperAdmin && !isManager;

  const roleLabel = isSuperAdmin ? t('role.superAdmin') : isManager ? t('role.manager') : t('role.member');
  const roleColor = isSuperAdmin ? 'text-brand-accent' : isManager ? 'text-purple-400' : 'text-sidebar-text/60';
  const avatarColor = isSuperAdmin ? 'bg-red-600' : isManager ? 'bg-purple-600' : 'bg-brand-primary';

  const closeMobile = () => onMobileClose?.();

  // User popover
  const [showUserMenu, setShowUserMenu] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={closeMobile} />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-sidebar-bg flex flex-col z-50 transition-all duration-200 ease-in-out',
          collapsed ? 'w-[68px]' : 'w-60',
          mobileOpen ? 'translate-x-0 w-60' : '-translate-x-full md:translate-x-0'
        )}
      >
        <button onClick={closeMobile} className="md:hidden absolute top-4 right-3 text-white/70 hover:text-white p-1" aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className={cn('py-5 flex items-center', collapsed ? 'px-4 justify-center' : 'px-6')}>
          {collapsed ? (
            <Logo size={28} withBg />
          ) : (
            <div className="flex items-center gap-2.5">
              <Logo size={32} withBg />
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">
                  {t('common.appTitle')}
                </h1>
                <span className={`text-[10px] uppercase tracking-wider font-semibold ${roleColor}`}>
                  {roleLabel}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className={cn('flex-1 overflow-y-auto', collapsed ? 'px-2' : 'px-3')}>
          {isSuperAdmin && (
            <>
              <SectionLabel label={t('nav.platform')} collapsed={collapsed} />
              <NavItem href="/dashboard" icon="grid" label={t('nav.dashboard')} isActive={router.pathname === '/dashboard'} collapsed={collapsed} onClick={closeMobile} />
              <NavItem href="/admin/groups" icon="shield" label={t('nav.groups')} isActive={router.pathname.startsWith('/admin/groups')} collapsed={collapsed} onClick={closeMobile} />
              <NavItem href="/admin/managers" icon="users" label={t('nav.users')} isActive={router.pathname.startsWith('/admin/managers')} collapsed={collapsed} onClick={closeMobile} />
              <NavItem href="/admin/audit" icon="file-text" label={t('nav.logs')} isActive={router.pathname.startsWith('/admin/audit')} collapsed={collapsed} onClick={closeMobile} />
              <NavItem href="/settings" icon="settings" label={t('nav.settings')} isActive={router.pathname === '/settings'} collapsed={collapsed} onClick={closeMobile} />
            </>
          )}

          {isManager && (
            <>
              <SectionLabel label={t('nav.manager')} collapsed={collapsed} />
              <NavItem href="/dashboard" icon="grid" label={t('nav.dashboard')} isActive={router.pathname === '/dashboard'} collapsed={collapsed} onClick={closeMobile} />
              <NavItem href="/verify" icon="check" label={t('nav.verifyPayments')} isActive={router.pathname.startsWith('/verify')} collapsed={collapsed} onClick={closeMobile} />
              <NavItem href="/members" icon="users" label={t('nav.members')} isActive={router.pathname.startsWith('/members')} collapsed={collapsed} onClick={closeMobile} />
              <NavItem href="/contributions" icon="wallet" label={t('nav.contributions')} isActive={router.pathname.startsWith('/contributions')} collapsed={collapsed} onClick={closeMobile} />
              <NavItem href="/fines" icon="alert-circle" label={t('nav.fines')} isActive={router.pathname.startsWith('/fines')} collapsed={collapsed} onClick={closeMobile} />
              <NavItem href="/expenses" icon="receipt" label={t('nav.expenses')} isActive={router.pathname.startsWith('/expenses')} collapsed={collapsed} onClick={closeMobile} />
            </>
          )}

          {isMember && (
            <>
              <SectionLabel label={t('nav.menu')} collapsed={collapsed} />
              <NavItem href="/dashboard" icon="grid" label={t('nav.dashboard')} isActive={router.pathname === '/dashboard'} collapsed={collapsed} onClick={closeMobile} />
              <NavItem href="/contributions" icon="wallet" label={t('nav.myContributions')} isActive={router.pathname.startsWith('/contributions')} collapsed={collapsed} onClick={closeMobile} />
              <NavItem href="/expenses" icon="receipt" label={t('nav.expenses')} isActive={router.pathname.startsWith('/expenses')} collapsed={collapsed} onClick={closeMobile} />
            </>
          )}
        </nav>

        {/* Language switcher */}
        <div className="px-3 pb-1">
          <button
            onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')}
            className={cn(
              'flex items-center w-full py-2 text-sidebar-text/70 hover:text-white transition-colors rounded-lg hover:bg-white/5',
              collapsed ? 'justify-center px-2' : 'gap-2.5 px-3'
            )}
            title={locale === 'en' ? 'বাংলায় পরিবর্তন করুন' : 'Switch to English'}
          >
            <Languages className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <span className="text-xs font-medium">{locale === 'en' ? 'বাংলা' : 'English'}</span>
            )}
          </button>
        </div>

        {/* Collapse toggle — absolute pill on right edge */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex absolute top-[60%] -right-3 h-6 w-6 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-gray-600 hover:shadow transition-all z-10"
          title={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
        >
          {collapsed ? <ChevronsRight className="w-3 h-3" /> : <ChevronsLeft className="w-3 h-3" />}
        </button>

        {/* User footer with popover */}
        {user && (
          <div className="relative border-t border-white/10 p-3" ref={popoverRef}>
            {/* Popover menu */}
            {showUserMenu && (
              <div className={cn(
                'absolute bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 overflow-hidden w-48 z-50',
                collapsed
                  ? 'bottom-5 left-full ml-2'
                  : 'bottom-full mb-2 left-3 right-3 w-auto'
              )}>
                <Link
                  href="/profile"
                  onClick={() => { setShowUserMenu(false); closeMobile(); }}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <UserCircle className="w-4 h-4 text-gray-400" />
                  {t('nav.profile')}
                </Link>
                <button
                  onClick={() => { setShowUserMenu(false); onLogout(); }}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  {t('nav.signOut')}
                </button>
              </div>
            )}

            {/* User button */}
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={cn(
                'w-full flex items-center rounded-lg transition-colors hover:bg-white/5 p-2',
                collapsed ? 'justify-center' : 'gap-3'
              )}
            >
              <Avatar src={user.avatarUrl} name={user.name} size="sm" className={user.avatarUrl ? '' : avatarColor} />
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-sidebar-text truncate">{user.email}</p>
                  </div>
                  <ChevronUp className={cn('w-4 h-4 text-sidebar-text/50 transition-transform', showUserMenu ? '' : 'rotate-180')} />
                </>
              )}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
