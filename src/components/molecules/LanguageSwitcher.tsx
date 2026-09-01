'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
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
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-[var(--border)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] text-xs font-sans font-medium transition rounded-md"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <span className="font-mono text-[0.6875rem]">{activeLang.code.toUpperCase()}</span>
        <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-52 bg-[var(--bg-surface)] border border-[var(--border)] shadow-lg rounded-lg z-50 p-1 space-y-0.5 text-xs"
        >
          <div className="px-2.5 py-1.5 text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">
            {t.selectLanguageHeader || 'Select Language'}
          </div>
          <div className="max-h-64 overflow-y-auto py-0.5 space-y-0.5">
            {supportedLanguages.map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  setLanguage(item.code);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 text-left text-xs flex items-center justify-between rounded-md transition ${
                  language === item.code
                    ? 'bg-[var(--text-main)] text-[var(--bg-surface)] font-semibold'
                    : 'text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)]'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{item.nativeName}</span>
                  <span className={`text-[0.6875rem] ${language === item.code ? 'text-[var(--bg-surface)]/80' : 'text-[var(--text-muted)]'}`}>
                    {item.name}
                  </span>
                </div>
                {language === item.code && <Check className="w-4 h-4 text-[var(--bg-surface)]" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

