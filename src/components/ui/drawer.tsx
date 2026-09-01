'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  level?: number; // 0 for base drawer, 1 for nested drawer in drawer, 2 for level 3, etc.
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  closeOnBackdropClick?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-full',
};

const levelZIndexes = [
  { backdrop: 'z-50', drawer: 'z-50' },
  { backdrop: 'z-[60]', drawer: 'z-[60]' },
  { backdrop: 'z-[70]', drawer: 'z-[70]' },
  { backdrop: 'z-[80]', drawer: 'z-[80]' },
  { backdrop: 'z-[90]', drawer: 'z-[90]' },
];

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  size = 'md',
  level = 0,
  children,
  footer,
  className,
  closeOnBackdropClick = true,
}) => {
  const { t } = useI18n();

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen && level === 0) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (level === 0) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isOpen, level]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const zConfig = levelZIndexes[Math.min(level, levelZIndexes.length - 1)];
  const widthClass = sizeClasses[size] || 'max-w-md';

  return (
    <div className={cn('fixed inset-0 overflow-hidden font-sans', zConfig.backdrop)}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-xs transition-opacity duration-200 ease-in-out"
        onClick={() => {
          if (closeOnBackdropClick) onClose();
        }}
        aria-hidden="true"
      />

      {/* Slide-Over Drawer Container (Appears from the Right side with smooth modern styling) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div
          className={cn(
            'w-screen bg-[var(--bg-surface)] text-[var(--text-main)] flex flex-col transform transition-transform duration-200 ease-in-out border-l border-[var(--border)] shadow-2xl rounded-l-2xl overflow-hidden',
            widthClass,
            className
          )}
        >
          {/* Drawer Header */}
          <div
            className="p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--bg-surface-elevated)]/50 flex items-center justify-between gap-4 shrink-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <div
                  className="w-8 h-8 bg-[var(--bg-surface)] text-[var(--text-main)] flex items-center justify-center shrink-0 border border-[var(--border)] rounded-lg shadow-xs"
                >
                  {icon}
                </div>
              )}
              <div className="truncate">
                <h2 className="text-sm sm:text-base font-bold text-[var(--text-main)] tracking-tight truncate">
                  {title}
                </h2>
                {subtitle && (
                  <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                    {subtitle}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-surface)] hover:bg-[var(--border)] border border-[var(--border)] rounded-lg transition shrink-0 cursor-pointer shadow-xs"
              title={t.drawerClose || 'Close'}
              aria-label={t.drawerClose || 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[var(--bg-surface)]">
            {children}
          </div>

          {/* Drawer Footer (Sticky Actions at Bottom) */}
          {footer && (
            <div
              className="p-3 sm:px-6 sm:py-4 border-t border-[var(--border)] bg-[var(--bg-surface-elevated)]/50 shrink-0 flex items-center justify-end gap-2"
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

