import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-ink-900 text-paper-100 flex items-center justify-center p-6 font-mono">
          <div className="max-w-md w-full bg-ink-800 border border-clay-400/40 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-clay-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h2 className="font-serif text-lg font-bold text-paper-100">Terminal UI Error</h2>
            </div>
            <p className="text-xs text-paper-400 leading-relaxed">
              An unexpected component error occurred in the terminal view.
            </p>
            <pre className="bg-ink-950 p-3 rounded-lg border border-ink-600 text-[11px] text-clay-400 overflow-x-auto">
              {this.state.error?.message || 'Unknown render error'}
            </pre>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brass-500 hover:bg-brass-400 text-ink-950 font-bold text-xs transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Terminal</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
