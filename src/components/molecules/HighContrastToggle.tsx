'use client';

import React, { useState, useEffect } from 'react';
import { Monitor, Sun } from 'lucide-react';

export const HighContrastToggle: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = (localStorage.getItem('etms_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('etms_theme', next);
    document.documentElement.setAttribute('data-theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 border border-[var(--border)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] rounded-md transition flex items-center justify-center"
      title={theme === 'dark' ? 'Switch to Warm Editorial (Light)' : 'Switch to Factory Charcoal (Dark)'}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Monitor className="w-4 h-4 text-[var(--text-muted)]" />
      )}
    </button>
  );
};

