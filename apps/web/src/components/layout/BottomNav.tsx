import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/cn';
import { User } from '@/hooks/useAuth';
import {
  LayoutDashboard, CheckCircle, Users, Wallet,
  Shield, FileText, Receipt, MoreHorizontal,
  AlertTriangle, Settings, UserCircle, LogOut, Languages, X,
} from 'lucide-react';
import { ComponentType, useState } from 'react';
import { useTranslation } from '@/i18n/useTranslation';

interface BottomNavProps {
  user: User | null;
  onLogout: () => void;
}

interface NavTab {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  match: (path: string) => boolean;
}

export function BottomNav({ user, onLogout }: BottomNavProps) {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();
  const [showMore, setShowMore] = useState(false);
  const isSuperAdmin = user?.systemRole === 'SUPER_ADMIN';
  const isManager = !isSuperAdmin && (user?.memberships?.some((m) => m.role === 'MANAGER') || false);

  const tabs: NavTab[] = isSuperAdmin
    ? [
        { href: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard'), match: (p) => p === '/dashboard' },
        { href: '/admin/groups', icon: Shield, label: t('nav.groups'), match: (p) => p.startsWith('/admin/groups') },
        { href: '/admin/managers', icon: Users, label: t('nav.users'), match: (p) => p.startsWith('/admin/managers') },
        { href: '/admin/audit', icon: FileText, label: t('nav.logs'), match: (p) => p.startsWith('/admin/audit') },
      ]
    : isManager
    ? [
        { href: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard'), match: (p) => p === '/dashboard' },
        { href: '/verify', icon: CheckCircle, label: t('nav.btmVerify'), match: (p) => p.startsWith('/verify') },
        { href: '/members', icon: Users, label: t('nav.members'), match: (p) => p.startsWith('/members') },
        { href: '/contributions', icon: Wallet, label: t('nav.btmPayments'), match: (p) => p.startsWith('/contributions') },
      ]
    : [
        { href: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard'), match: (p) => p === '/dashboard' },
        { href: '/contributions', icon: Wallet, label: t('nav.btmPayments'), match: (p) => p.startsWith('/contributions') },
        { href: '/expenses', icon: Receipt, label: t('nav.expenses'), match: (p) => p.startsWith('/expenses') },
      ];

  // Extra items shown in the "More" sheet
  const moreItems: NavTab[] = isSuperAdmin
    ? [
        { href: '/settings', icon: Settings, label: t('nav.settings'), match: (p) => p === '/settings' },
        { href: '/profile', icon: UserCircle, label: t('nav.profile'), match: (p) => p === '/profile' },
      ]
    : isManager
    ? [
        { href: '/fines', icon: AlertTriangle, label: t('nav.fines'), match: (p) => p.startsWith('/fines') },
        { href: '/expenses', icon: Receipt, label: t('nav.expenses'), match: (p) => p.startsWith('/expenses') },
        { href: '/profile', icon: UserCircle, label: t('nav.profile'), match: (p) => p === '/profile' },
      ]
    : [
        { href: '/profile', icon: UserCircle, label: t('nav.profile'), match: (p) => p === '/profile' },
      ];

  return (
    <>
      {/* More bottom sheet */}
      {showMore && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="px-4 pb-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.match(router.pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3.5 rounded-xl transition-colors',
                      isActive ? 'bg-brand-primary/5 text-brand-primary' : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}

              {/* Language toggle */}
              <button
                onClick={() => { setLocale(locale === 'en' ? 'bn' : 'en'); setShowMore(false); }}
                className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-gray-700 hover:bg-gray-50 w-full"
              >
                <Languages className="w-5 h-5" />
                <span className="text-sm font-medium">{locale === 'en' ? 'বাংলা' : 'English'}</span>
              </button>

              {/* Sign out */}
              <button
                onClick={() => { setShowMore(false); onLogout(); }}
                className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">{t('nav.signOut')}</span>
              </button>
            </div>

            {/* Bottom safe area */}
            <div className="h-[env(safe-area-inset-bottom,8px)]" />
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-[env(safe-area-inset-bottom,8px)]">
        <div className="bg-white/95 backdrop-blur-lg rounded-t-2xl shadow-[0_-2px_24px_rgba(0,0,0,0.1)] border-t border-gray-100/80 flex items-end justify-around px-2 pt-2 pb-2">
          {tabs.map((tab) => {
            const isActive = tab.match(router.pathname);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center flex-1 transition-all duration-300 ease-out',
                  isActive ? '-mt-4 pb-1' : 'py-1'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center rounded-full transition-all duration-300 ease-out',
                  isActive
                    ? 'h-14 w-14 bg-brand-primary shadow-xl shadow-brand-primary/30'
                    : 'h-10 w-10'
                )}>
                  <Icon className={cn(
                    'transition-all duration-300',
                    isActive ? 'w-6 h-6 text-white' : 'w-[22px] h-[22px] text-gray-400'
                  )} />
                </div>
                <span className={cn(
                  'text-[11px] mt-1.5 whitespace-nowrap transition-all duration-300',
                  isActive ? 'font-bold text-brand-primary' : 'font-medium text-gray-400'
                )}>
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex flex-col items-center flex-1 py-1"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-full">
              <MoreHorizontal className="w-[22px] h-[22px] text-gray-400" />
            </div>
            <span className="text-[11px] mt-1.5 font-medium text-gray-400">{t('nav.more')}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
