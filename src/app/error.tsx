'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { useI18n } from '@/lib/i18n';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    logger.error('Unhandled page error', { error: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 p-4">
      <div className="rounded-full bg-red-100 p-4">
        <AlertTriangle className="h-10 w-10 text-red-600" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-800">
          {t.errorTitle || 'Something went wrong'}
        </h2>
        <p className="text-sm text-slate-500 bg-slate-100 p-3 rounded-lg border border-slate-200 max-w-lg break-words">
          {error.message || t.errorDefaultMessage || 'An unexpected error occurred.'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <button
          onClick={() => reset()}
          className={cn(
            "inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 min-h-[48px]"
          )}
        >
          {t.errorTryAgain || 'Try Again'}
        </button>
        <button
          onClick={() => router.push('/')}
          className={cn(
            "inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 min-h-[48px]"
          )}
        >
          {t.errorGoToDashboard || 'Go to Dashboard'}
        </button>
      </div>
    </div>
  );
}

