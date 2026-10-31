import React, { Component, ErrorInfo, ReactNode } from 'react';

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
    console.error('[RERO Webview ErrorBoundary caught error]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-zinc-950 text-zinc-100 p-6 text-center select-none">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold mb-3 text-lg">
            !
          </div>
          <h2 className="text-sm font-semibold text-zinc-100">RERO Webview Encountered an Error</h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm font-mono bg-zinc-900 border border-zinc-800 p-2 rounded text-left overflow-auto max-h-32 text-[11px]">
            {this.state.error?.message || 'Unknown render error'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="mt-4 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium text-white transition-colors"
          >
            Reload Interface
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
