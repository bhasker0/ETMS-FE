'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-strong)] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[#2c2c2c] dark:hover:bg-[#d4d4d4] active:scale-[0.98]',
        secondary: 'bg-[var(--bg-surface-elevated)] text-[var(--text-main)] hover:bg-[var(--border)] border border-[var(--border)] active:scale-[0.98]',
        accent: 'bg-[var(--text-main)] text-[var(--bg-surface)] hover:opacity-90 active:scale-[0.98]',
        outline: 'border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)] active:scale-[0.98]',
        ghost: 'hover:bg-[var(--bg-surface-elevated)] text-[var(--text-main)] active:scale-[0.98]',
        destructive: 'bg-rose-700 text-white hover:bg-rose-800 active:scale-[0.98]',
        link: 'text-[var(--text-main)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-3.5 py-1.5',
        sm: 'h-7.5 px-2.5 text-2xs',
        lg: 'h-10 px-5 text-sm',
        icon: 'h-8 w-8 p-1.5',
        touch: 'h-11 min-w-[44px] px-4 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
