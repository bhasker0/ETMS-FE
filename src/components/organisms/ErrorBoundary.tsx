'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    logger.error(`Uncaught React Boundary Error: ${error.message}`, {
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-800 border-2 border-red-500 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10" />
            </div>
            
            <h2 className="text-2xl font-bold text-red-400">
              સિસ્ટમ ત્રુટિ / Application Error
            </h2>
            
            <p className="text-slate-300 text-sm">
              એપ્લિકેશનમાં ક્ષતિ આવી છે. ટેકનિકલ ટીમને લોગ મોકલી દેવાયો છે.
            </p>

            <div className="bg-slate-950 p-3 rounded-lg text-left text-xs font-mono text-red-300 overflow-x-auto max-h-32 border border-slate-700">
              {this.state.error?.toString()}
            </div>

            <button
              onClick={this.handleReset}
              className="w-full min-h-[56px] bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 text-lg shadow-lg active:scale-98 transition"
            >
              <RefreshCw className="w-6 h-6" />
              ફરી શરૂ કરો / Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
