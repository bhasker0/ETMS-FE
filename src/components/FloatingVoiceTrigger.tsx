'use client';

import React, { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';
import { UniversalSpeechDataEntryDrawer, SpeechCategory } from './UniversalSpeechDataEntryDrawer';

export function FloatingVoiceTrigger() {
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

  return (
    <>
      {/* Floating Action Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2 px-3.5 py-2.5 bg-[#111111] text-[#F7F6F3] rounded-full shadow-lg hover:shadow-xl border border-white/20 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          title="Universal Speech Data Entry (Bhashini Indic ASR)"
          aria-label="Universal Speech Data Entry"
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <Mic className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>

          <span className="text-xs font-bold tracking-tight pr-1">
            Voice Entry
          </span>

          <span className="hidden sm:inline-block text-[0.625rem] font-semibold uppercase px-1.5 py-0.5 rounded bg-white/10 text-amber-300">
            ASR
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
