'use client';

import React from 'react';
import { useRole } from '@/lib/role-context';
import { useI18n } from '@/lib/i18n';
import { UserRole } from '@/lib/types';
import { Factory, Wrench, FileSpreadsheet } from 'lucide-react';

export const RoleSelector: React.FC = () => {
  const { role, setRole } = useRole();
  const { t } = useI18n();

  const roles: { id: UserRole; label: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'shopfloor',
      label: t.roleShopfloor,
      icon: <Wrench className="w-4 h-4" />,
      color: 'bg-[#10B981] text-white',
    },
    {
      id: 'owner',
      label: t.roleOwner,
      icon: <Factory className="w-4 h-4" />,
      color: 'bg-[var(--primary)] text-white',
    },
    {
      id: 'munim',
      label: t.roleMunim,
      icon: <FileSpreadsheet className="w-4 h-4" />,
      color: 'bg-[var(--primary)] text-white',
    },
  ];

  return (
    <div className="flex bg-[var(--bg-canvas)] p-1 rounded-xl border border-[var(--border)] shadow-xs overflow-x-auto">
      {roles.map((r) => {
        const isActive = role === r.id;
        return (
          <button
            key={r.id}
            onClick={() => setRole(r.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[42px] rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              isActive
                ? `${r.color} shadow-sm font-extrabold scale-102`
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white'
            }`}
          >
            {r.icon}
            <span>{r.label}</span>
          </button>
        );
      })}
    </div>
  );
};
