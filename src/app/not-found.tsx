'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <h1 className="text-6xl font-bold text-slate-800">404</h1>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-700">
          {t.notFoundTitle || 'Page Not Found'}
        </h2>
        <p className="text-slate-500 max-w-md">
          {t.notFoundDesc || 'The page you are looking for might have been removed or is temporarily unavailable.'}
        </p>
      </div>
      <Link
        href="/"
        className={cn(
          "inline-flex items-center justify-center rounded-xl bg-amber-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 min-h-[48px]"
        )}
      >
        <Home className="mr-2 h-5 w-5" />
        <span>{t.notFoundBackHome || 'Back to Dashboard'}</span>
      </Link>
    </div>
  );
}

