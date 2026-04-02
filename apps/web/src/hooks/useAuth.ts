import { createContext, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';

export interface Membership {
  role: string;
  group: { id: string; name: string };
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  bkashNumber: string | null;
  systemRole: 'SUPER_ADMIN' | 'USER';
  memberships: Membership[];
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  refresh: async () => {},
});

export function useAuth(requireAuth = true) {
  const ctx = useContext(AuthContext);
  const router = useRouter();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!ctx.loading && !ctx.user && requireAuth && !router.pathname.startsWith('/auth')) {
      router.replace('/auth/login');
    }
  }, [ctx.loading, ctx.user, requireAuth, router]);

  const isSuperAdmin = ctx.user?.systemRole === 'SUPER_ADMIN';
  const isManager = !isSuperAdmin && (ctx.user?.memberships?.some((m) => m.role === 'MANAGER') || false);
  const isMember = !isSuperAdmin && !isManager;

  const getGroupRole = (groupId: string) => {
    return ctx.user?.memberships.find((m) => m.group.id === groupId)?.role || null;
  };

  const isManagerOf = (groupId: string) => {
    return isSuperAdmin || getGroupRole(groupId) === 'MANAGER';
  };

  return { ...ctx, isSuperAdmin, isManager, isMember, getGroupRole, isManagerOf };
}

/**
 * Hook to guard a page by role. Redirects to /dashboard if unauthorized.
 */
export function useRequireRole(role: 'SUPER_ADMIN' | 'MANAGER' | 'MEMBER') {
  const { user, loading, isSuperAdmin, isManager } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    let allowed = false;
    if (role === 'SUPER_ADMIN') allowed = isSuperAdmin;
    else if (role === 'MANAGER') allowed = isSuperAdmin || isManager;
    else allowed = true; // MEMBER = any authenticated user
    if (!allowed) router.replace('/dashboard');
  }, [loading, user, role, isSuperAdmin, isManager, router]);

  return { user, loading, authorized: !loading && !!user };
}
