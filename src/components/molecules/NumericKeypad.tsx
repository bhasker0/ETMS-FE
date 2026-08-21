'use client';

import React from 'react';
import { Delete, CornerDownLeft, RotateCcw } from 'lucide-react';
import { feedback } from '@/lib/audio-haptic';

interface NumericKeypadProps {
  value: string;
  onChange: (val: string) => void;
  onEnter?: () => void;
  maxDigits?: number;
  label?: string;
  helperText?: string;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  value,
  onChange,
  onEnter,
  maxDigits = 10,
  label,
  helperText,
}) => {
  const handleDigit = (digit: string) => {
    feedback.playKeyTick();
    feedback.vibrate(25);

    if (value === '0' && digit !== '.') {
      onChange(digit);
      return;
    }

    if (value.length < maxDigits) {
      onChange(value + digit);
    }
  };

  const handleBackspace = () => {
    feedback.playKeyTick();
    feedback.vibrate(35);
    if (value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    feedback.playKeyTick();
    feedback.vibrate(50);
    onChange('');
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['00', '0', '.'],
  ];

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-[#E2E8F0] rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
      {/* Display Screen */}
      <div className="bg-[#1E293B] border-2 border-[#0099B8] rounded-2xl p-4 text-right shadow-inner">
        {label && <div className="text-xs text-[#0099B8] font-bold mb-1 tracking-wider">{label}</div>}
        <div className="font-mono text-3xl sm:text-4xl font-extrabold text-white tracking-widest min-h-[48px] flex items-center justify-end overflow-x-auto">
          {value || <span className="text-[#64748B] font-normal">0</span>}
        </div>
        {helperText && <div className="text-xs text-[#E0F2FE] mt-1">{helperText}</div>}
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {keys.map((row, rIdx) => (
          <React.Fragment key={rIdx}>
            {row.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => handleDigit(k)}
                className="h-16 sm:h-20 bg-[#F8FAFC] hover:bg-[#E0F2FE] active:bg-[#0099B8] active:text-white border border-[#E2E8F0] rounded-2xl text-2xl sm:text-3xl font-black text-[#1E293B] shadow-xs active:scale-95 transition-all flex items-center justify-center select-none"
              >
                {k}
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Action Row: Clear, Backspace, Next/Done */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 pt-1">
        <button
          type="button"
          onClick={handleClear}
          className="h-14 sm:h-16 bg-[#FEF2F2] hover:bg-[#FEE2E2] active:bg-[#EF4444] border border-[#FECACA] text-[#EF4444] active:text-white font-bold rounded-2xl flex items-center justify-center gap-1 text-xs sm:text-sm shadow-xs active:scale-95 transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>સાફ / Clear</span>
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          className="h-14 sm:h-16 bg-[#F8FAFC] hover:bg-[#E2E8F0] active:bg-[#0099B8] active:text-white border border-[#E2E8F0] text-[#0099B8] font-bold rounded-2xl flex items-center justify-center text-lg shadow-xs active:scale-95 transition"
        >
          <Delete className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={onEnter}
          className="h-14 sm:h-16 bg-[#0099B8] hover:bg-[#0E7090] active:bg-[#0E7090] border border-[#0099B8] text-white font-bold rounded-2xl flex items-center justify-center gap-1.5 text-xs sm:text-sm shadow-md active:scale-95 transition"
        >
          <span>આગળ / Next</span>
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
