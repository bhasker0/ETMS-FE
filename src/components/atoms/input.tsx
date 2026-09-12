'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] tracking-wider"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            'flex h-9 w-full rounded-md border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3 py-1.5 text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:border-[var(--text-main)] transition-colors disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-rose-500 focus-visible:border-rose-600',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-2xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
