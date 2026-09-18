'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Mic } from 'lucide-react';
import { UniversalSpeechDataEntryDrawer, SpeechCategory } from './UniversalSpeechDataEntryDrawer';

export function FloatingVoiceTrigger() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [initialCategory, setInitialCategory] = useState<SpeechCategory>('challan');

  useEffect(() => {
    const handleOpenSpeech = (e: Event) => {
      const customEvent = e as CustomEvent<{ category?: SpeechCategory }>;
      if (customEvent.detail?.category) {
        setInitialCategory(customEvent.detail.category);
      }
      setIsOpen(true);
    };

    window.addEventListener('open-speech-data-entry', handleOpenSpeech);
    return () => {
      window.removeEventListener('open-speech-data-entry', handleOpenSpeech);
    };
  }, []);

  if (pathname === '/login' || pathname === '/forgot-password') {
    return null;
  }

  return (
    <>
      {/* Floating Action Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-slate-950/85 text-slate-100 rounded-full shadow-2xl hover:shadow-purple-500/30 border border-white/20 backdrop-blur-xl transition-all transform hover:-translate-y-1 active:scale-95 cursor-pointer ring-1 ring-white/10"
          title="Universal Voice Assistant (Bhashini Indic ASR)"
          aria-label="Universal Voice Assistant"
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-tr from-rose-500 to-amber-400"></span>
            </span>
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-500/20 via-purple-500/20 to-amber-500/20 flex items-center justify-center border border-white/15">
              <Mic className="w-4 h-4 text-rose-400 animate-pulse" />
            </div>
          </div>

          <span className="text-xs font-bold tracking-tight text-slate-100 pr-0.5">
            Voice Assistant
          </span>

          <span className="hidden sm:inline-block text-[0.625rem] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-rose-500/20 text-rose-300 border border-rose-500/30">
            Zero-Click AI
          </span>
        </button>
      </div>

      <UniversalSpeechDataEntryDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialCategory={initialCategory}
      />
    </>
  );
}
