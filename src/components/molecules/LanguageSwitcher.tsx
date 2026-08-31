'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Language } from '@/lib/types';
import { Globe, Check, ChevronDown } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, supportedLanguages, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLang = supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs transition focus:outline-hidden"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-[#0099B8]" />
        <span className="font-medium">{activeLang.nativeName}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-2xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            {t.selectLanguageHeader || 'Select Language'}
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {supportedLanguages.map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  setLanguage(item.code);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition ${
                  language === item.code
                    ? 'bg-cyan-50/80 text-[#0099B8] font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900">{item.nativeName}</span>
                  <span className="text-2xs text-slate-400">{item.name}</span>
                </div>
                {language === item.code && <Check className="w-4 h-4 text-[#0099B8]" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
