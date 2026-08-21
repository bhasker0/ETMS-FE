'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Language } from '@/lib/types';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useI18n();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'gu', label: 'ગુજરાતી', flag: '🇬🇺' },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  return (
    <div className="inline-flex bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0] items-center shadow-xs">
      <div className="px-2 text-[#0099B8] hidden sm:flex items-center gap-1">
        <Globe className="w-4 h-4" />
      </div>
      <div className="flex gap-1">
        {languages.map((item) => (
          <button
            key={item.code}
            onClick={() => setLanguage(item.code)}
            className={`px-3 py-1.5 min-h-[38px] text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              language === item.code
                ? 'bg-[#0099B8] text-white shadow-sm font-extrabold scale-102'
                : 'text-[#64748B] hover:bg-white hover:text-[#1E293B]'
            }`}
          >
            <span>{item.flag}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
