import { createContext, useContext } from 'react';
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

  // Redirect if not authed and required
  if (!ctx.loading && !ctx.user && requireAuth) {
    if (typeof window !== 'undefined' && !router.pathname.startsWith('/auth')) {
      router.replace('/auth/login');
    }
  }

  const isSuperAdmin = ctx.user?.systemRole === 'SUPER_ADMIN';

  const getGroupRole = (groupId: string) => {
    return ctx.user?.memberships.find((m) => m.group.id === groupId)?.role || null;
  };

  const isManagerOf = (groupId: string) => {
    return isSuperAdmin || getGroupRole(groupId) === 'MANAGER';
  };

  return { ...ctx, isSuperAdmin, getGroupRole, isManagerOf };
}
