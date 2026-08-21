'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from './types';

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isShopfloor: boolean;
  isOwner: boolean;
  isMunim: boolean;
}

const RoleContext = createContext<RoleContextType>({
  role: 'owner',
  setRole: () => {},
  isShopfloor: false,
  isOwner: true,
  isMunim: false,
});

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('owner');

  useEffect(() => {
    const saved = localStorage.getItem('etms_role') as UserRole;
    if (saved && (saved === 'shopfloor' || saved === 'owner' || saved === 'munim')) {
      setRoleState(saved);
    }
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem('etms_role', newRole);
    }
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        isShopfloor: role === 'shopfloor',
        isOwner: role === 'owner',
        isMunim: role === 'munim',
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);
