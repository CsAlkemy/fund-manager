import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/cn';
import { User } from '@/hooks/useAuth';
import {
  LayoutDashboard, Shield, Users, FileText, Settings,
  Globe, CheckCircle, AlertTriangle, Wallet, UserCircle,
  X, ChevronsLeft, ChevronsRight, LogOut, ChevronUp,
} from 'lucide-react';
import { ComponentType, useState, useRef, useEffect } from 'react';

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
  const isSuperAdmin = user?.systemRole === 'SUPER_ADMIN';
  const isManager = !isSuperAdmin && (user?.memberships?.some((m) => m.role === 'MANAGER') || false);
  const isMember = !isSuperAdmin && !isManager;

  const roleLabel = isSuperAdmin ? 'Super Admin' : isManager ? 'Manager' : 'Member';
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
            <span className="text-brand-accent text-xl font-bold">✦</span>
          ) : (
            <div>
              <h1 className="text-xl font-bold text-white">
                <span className="text-brand-accent">✦</span> Fund Manager
              </h1>
              <span className={`text-[10px] uppercase tracking-wider font-semibold ${roleColor}`}>
                {roleLabel}
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className={cn('flex-1 overflow-y-auto', collapsed ? 'px-2' : 'px-3')}>
          {isSuperAdmin && (
            <>
              <SectionLabel label="Platform" collapsed={collapsed} />
              <NavItem href="/dashboard" icon="grid" label="Dashboard" isActive={router.pathname === '/dashboard'} collapsed={collapsed} onClick={closeMobile} />
              <NavItem href="/admin/groups" icon="shield" label="Groups" isActive={router.pathname.startsWith('/admin/groups')} collapsed={collapsed} onClick={closeMobile} />
              <NavItem href="/admin/managers" icon="users" label="Users" isActive={router.pathname.startsWith('/admin/managers')} collapsed={collapsed} onClick={closeMobile} />
              <NavItem href="/admin/audit" icon="file-text" label="Logs" isActive={router.pathname.startsWith('/admin/audit')} collapsed={collapsed} onClick={closeMobile} />
              <NavItem href="/settings" icon="settings" label="Settings" isActive={router.pathname === '/settings'} collapsed={collapsed} onClick={closeMobile} />
            </>
          )}

          {isManager && (
            <>
              <SectionLabel label="Manager" collapsed={collapsed} />
              <NavItem href="/dashboard" icon="grid" label="Dashboard" isActive={router.pathname === '/dashboard'} collapsed={collapsed} onClick={closeMobile} />
              <NavItem href="/verify" icon="check" label="Verify Payments" isActive={router.pathname.startsWith('/verify')} collapsed={collapsed} onClick={closeMobile} />
              <NavItem href="/members" icon="users" label="Members" isActive={router.pathname.startsWith('/members')} collapsed={collapsed} onClick={closeMobile} />
              <NavItem href="/contributions" icon="wallet" label="Contributions" isActive={router.pathname.startsWith('/contributions')} collapsed={collapsed} onClick={closeMobile} />
              <NavItem href="/fines" icon="alert-circle" label="Fines" isActive={router.pathname.startsWith('/fines')} collapsed={collapsed} onClick={closeMobile} />
            </>
          )}

          {isMember && (
            <>
              <SectionLabel label="Menu" collapsed={collapsed} />
              <NavItem href="/dashboard" icon="grid" label="Dashboard" isActive={router.pathname === '/dashboard'} collapsed={collapsed} onClick={closeMobile} />
              <NavItem href="/contributions" icon="wallet" label="My Contributions" isActive={router.pathname.startsWith('/contributions')} collapsed={collapsed} onClick={closeMobile} />
            </>
          )}
        </nav>

        {/* Collapse toggle */}
        <div className="px-3 pb-1">
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center w-full py-2 text-sidebar-text/50 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
        </div>

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
                  Profile
                </Link>
                <button
                  onClick={() => { setShowUserMenu(false); onLogout(); }}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
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
              <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0', avatarColor)}>
                {user.name.charAt(0).toUpperCase()}
              </div>
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
