import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import { GroupContext } from './useGroup';

const STORAGE_KEY = 'selectedGroupId';

export function GroupProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedGroupId, setSelectedGroupIdState] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize from localStorage once user is available
  useEffect(() => {
    if (!user) return;

    const memberships = user.memberships || [];
    if (memberships.length === 0) {
      setSelectedGroupIdState(null);
      setInitialized(true);
      return;
    }

    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const isValid = stored && memberships.some((m) => m.group.id === stored);

    setSelectedGroupIdState(isValid ? stored : memberships[0].group.id);
    setInitialized(true);
  }, [user]);

  // Re-validate when memberships change (e.g., after refresh())
  useEffect(() => {
    if (!initialized || !user) return;
    const memberships = user.memberships || [];
    if (memberships.length === 0) {
      setSelectedGroupIdState(null);
      return;
    }
    if (selectedGroupId && !memberships.some((m) => m.group.id === selectedGroupId)) {
      const fallback = memberships[0].group.id;
      setSelectedGroupIdState(fallback);
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, fallback);
    }
  }, [user?.memberships, initialized, selectedGroupId, user]);

  const setSelectedGroupId = useCallback((id: string) => {
    setSelectedGroupIdState(id);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const selectedMembership = useMemo(() => {
    if (!user || !selectedGroupId) return null;
    return user.memberships.find((m) => m.group.id === selectedGroupId) || null;
  }, [user, selectedGroupId]);

  const roleInSelected = selectedMembership?.role || null;
  const isSuperAdmin = user?.systemRole === 'SUPER_ADMIN';
  const isManagerOfSelected = isSuperAdmin || roleInSelected === 'MANAGER';
  const isMemberOfSelected = !isSuperAdmin && roleInSelected === 'MEMBER';

  return (
    <GroupContext.Provider
      value={{
        selectedGroupId,
        selectedMembership,
        setSelectedGroupId,
        roleInSelected,
        isManagerOfSelected,
        isMemberOfSelected,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}
