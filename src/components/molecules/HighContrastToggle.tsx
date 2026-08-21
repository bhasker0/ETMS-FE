'use client';

import React, { useState, useEffect } from 'react';
import { Contrast } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export const HighContrastToggle: React.FC = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const saved = localStorage.getItem('etms_high_contrast') === 'true';
    setIsHighContrast(saved);
    if (saved) {
      document.documentElement.classList.add('high-contrast');
    }
  }, []);

  const toggleContrast = () => {
    const next = !isHighContrast;
    setIsHighContrast(next);
    localStorage.setItem('etms_high_contrast', String(next));
    if (next) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };

  return (
    <button
      onClick={toggleContrast}
      className={`px-3 py-1.5 min-h-[38px] rounded-xl border font-bold text-xs flex items-center gap-1.5 transition ${
        isHighContrast
          ? 'bg-[#F58220] text-white border-[#F58220] font-extrabold shadow-sm'
          : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:text-[#1E293B] hover:bg-white shadow-xs'
      }`}
      title={isHighContrast ? t.normalContrast : t.highContrast}
    >
      <Contrast className="w-4 h-4 text-[#0099B8]" />
      <span className="hidden lg:inline">{isHighContrast ? 'હાઇ કોન્ટ્રાસ્ટ (ON)' : t.highContrast}</span>
    </button>
  );
};
