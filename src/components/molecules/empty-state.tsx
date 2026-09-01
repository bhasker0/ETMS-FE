import * as React from 'react';
import { cn } from '@/lib/utils';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-xs',
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border)] flex items-center justify-center mb-4 text-[var(--text-muted)] shadow-xs">
        {icon || <PackageOpen className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-bold text-[var(--text-main)] mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-[var(--text-muted)] max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};
