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
    <div className={cn('fixed inset-0 overflow-hidden', zConfig.backdrop)}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 ease-in-out"
        onClick={() => {
          if (closeOnBackdropClick) onClose();
        }}
        aria-hidden="true"
      />

      {/* Slide-Over Drawer Container (Appears from the Right side, Ant UI / Tailwind style) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={cn(
            'w-screen bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200',
            widthClass,
            className
          )}
        >
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-200 bg-white flex items-center justify-between gap-4 shrink-0 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                  {icon}
                </div>
              )}
              <div className="truncate">
                <h2 className="text-base font-bold text-slate-900 tracking-tight truncate">
                  {title}
                </h2>
                {subtitle && (
                  <div className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    {subtitle}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition shrink-0"
              title={t.drawerClose || 'Close'}
              aria-label={t.drawerClose || 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
            {children}
          </div>

          {/* Drawer Footer (Sticky Actions at Bottom) */}
          {footer && (
            <div className="p-4 sm:px-6 border-t border-slate-200 bg-white shrink-0 flex items-center justify-end gap-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
