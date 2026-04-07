import { createContext, useContext } from 'react';
import { Membership } from './useAuth';

export interface GroupContextType {
  selectedGroupId: string | null;
  selectedMembership: Membership | null;
  setSelectedGroupId: (id: string) => void;
  roleInSelected: string | null;
  isManagerOfSelected: boolean;
  isMemberOfSelected: boolean;
}

export const GroupContext = createContext<GroupContextType>({
  selectedGroupId: null,
  selectedMembership: null,
  setSelectedGroupId: () => {},
  roleInSelected: null,
  isManagerOfSelected: false,
  isMemberOfSelected: false,
});

export function useGroup() {
  return useContext(GroupContext);
}
