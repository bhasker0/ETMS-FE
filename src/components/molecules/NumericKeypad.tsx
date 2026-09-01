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
    <div className="w-full max-w-md mx-auto bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 space-y-4 shadow-sm">
      {/* Display Screen */}
      <div className="bg-[var(--bg-canvas)] border border-[var(--border)] p-4 text-right relative rounded-xl">
        <span className="absolute top-2 left-3 text-[0.6875rem] text-[var(--text-muted)] font-medium uppercase tracking-wider">
          {label || 'Digital Keypad Input'}
        </span>
        <div className="font-mono text-3xl sm:text-4xl font-bold text-[var(--text-main)] tabular-nums min-h-[48px] flex items-center justify-end overflow-x-auto pt-4">
          {value || <span className="text-[var(--text-muted)] font-normal">0</span>}
        </div>
        {helperText && <div className="text-[0.6875rem] text-[var(--text-muted)] mt-1 font-mono">{helperText}</div>}
      </div>

      {/* Keypad Grid (64px Touch Height) */}
      <div className="grid grid-cols-3 gap-2">
        {keys.map((row, rIdx) => (
          <React.Fragment key={rIdx}>
            {row.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => handleDigit(k)}
                className="h-16 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] active:scale-[0.97] border border-[var(--border)] text-2xl font-mono font-bold text-[var(--text-main)] transition-all flex items-center justify-center select-none cursor-pointer rounded-xl shadow-xs"
              >
                {k}
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Action Row: Clear, Backspace, Next/Done */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          type="button"
          onClick={handleClear}
          className="h-14 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 active:scale-[0.97] border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 font-semibold flex items-center justify-center gap-1.5 text-xs uppercase cursor-pointer rounded-xl transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Clear</span>
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          className="h-14 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] active:scale-[0.97] border border-[var(--border)] text-[var(--text-main)] font-semibold flex items-center justify-center gap-1.5 text-xs uppercase cursor-pointer rounded-xl transition-all"
        >
          <Delete className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onEnter}
          className="h-14 bg-[var(--text-main)] hover:opacity-90 active:scale-[0.97] text-[var(--bg-surface)] font-bold flex items-center justify-center gap-1.5 text-xs uppercase cursor-pointer rounded-xl transition-all shadow-sm"
        >
          <span>Enter</span>
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

