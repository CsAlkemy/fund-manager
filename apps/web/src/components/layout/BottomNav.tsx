import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/cn';
import { User } from '@/hooks/useAuth';
import {
  LayoutDashboard, CheckCircle, Users, Wallet,
  Shield, FileText, Receipt, MoreHorizontal,
} from 'lucide-react';
import { ComponentType } from 'react';

interface BottomNavProps {
  user: User | null;
  onMoreClick: () => void;
}

interface NavTab {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  match: (path: string) => boolean;
}

export function BottomNav({ user, onMoreClick }: BottomNavProps) {
  const router = useRouter();
  const isSuperAdmin = user?.systemRole === 'SUPER_ADMIN';
  const isManager = !isSuperAdmin && (user?.memberships?.some((m) => m.role === 'MANAGER') || false);

  const tabs: NavTab[] = isSuperAdmin
    ? [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Home', match: (p) => p === '/dashboard' },
        { href: '/admin/groups', icon: Shield, label: 'Groups', match: (p) => p.startsWith('/admin/groups') },
        { href: '/admin/managers', icon: Users, label: 'Users', match: (p) => p.startsWith('/admin/managers') },
        { href: '/admin/audit', icon: FileText, label: 'Logs', match: (p) => p.startsWith('/admin/audit') },
      ]
    : isManager
    ? [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Home', match: (p) => p === '/dashboard' },
        { href: '/verify', icon: CheckCircle, label: 'Verify', match: (p) => p.startsWith('/verify') },
        { href: '/members', icon: Users, label: 'Members', match: (p) => p.startsWith('/members') },
        { href: '/contributions', icon: Wallet, label: 'Payments', match: (p) => p.startsWith('/contributions') },
      ]
    : [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Home', match: (p) => p === '/dashboard' },
        { href: '/contributions', icon: Wallet, label: 'Payments', match: (p) => p.startsWith('/contributions') },
        { href: '/expenses', icon: Receipt, label: 'Expenses', match: (p) => p.startsWith('/expenses') },
      ];

  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-gray-100/80 flex items-center justify-around px-2 py-1.5">
        {tabs.map((tab) => {
          const isActive = tab.match(router.pathname);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center min-w-[48px] transition-all duration-300 ease-out',
                isActive ? '-mt-5' : 'py-1.5 px-2'
              )}
            >
              <div className={cn(
                'flex items-center justify-center rounded-full transition-all duration-300 ease-out',
                isActive
                  ? 'h-12 w-12 bg-brand-primary shadow-lg shadow-brand-primary/30 scale-100'
                  : 'h-8 w-8 bg-transparent scale-90'
              )}>
                <Icon className={cn(
                  'w-5 h-5 transition-colors duration-300',
                  isActive ? 'text-white' : 'text-gray-400'
                )} />
              </div>
              <span className={cn(
                'text-[10px] mt-1 transition-all duration-300',
                isActive ? 'font-semibold text-brand-primary' : 'font-medium text-gray-400'
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}

        {/* More button — opens sidebar */}
        <button
          onClick={onMoreClick}
          className="flex flex-col items-center py-1.5 px-2 min-w-[48px]"
        >
          <div className="h-8 w-8 flex items-center justify-center rounded-full scale-90">
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </div>
          <span className="text-[10px] mt-1 font-medium text-gray-400">More</span>
        </button>
      </div>
    </nav>
  );
}
