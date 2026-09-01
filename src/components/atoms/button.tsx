'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[var(--primary)] text-white hover:bg-[#9494ff] shadow-xs active:scale-[0.98]',
        secondary: 'bg-[var(--bg-surface-elevated)] text-[var(--text-main)] hover:bg-[#9494ff]/20 border border-[var(--border)] shadow-xs',
        accent: 'bg-[#9494ff] text-white hover:bg-[#b3b3ff] shadow-xs',
        outline: 'border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)]',
        ghost: 'hover:bg-[var(--bg-surface-elevated)] text-[var(--text-main)]',
        destructive: 'bg-[#EF4444] text-white hover:bg-[#EF4444]/90 shadow-xs',
        link: 'text-[var(--primary)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-xl px-8',
        icon: 'h-10 w-10',
        touch: 'h-12 min-w-[48px] px-6 text-base',
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
