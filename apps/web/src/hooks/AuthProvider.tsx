import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';
import { AuthContext, User } from './useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/profile');
      setUser(res.data);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch once on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    router.replace('/auth/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refresh: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
