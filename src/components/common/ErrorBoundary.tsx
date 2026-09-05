import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[TV ErrorBoundary] Uncaught error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    // Reset state and reload page for clean fresh TV restart
    this.setState({ hasError: false, error: null, errorInfo: null });
    try {
      window.location.reload();
    } catch {
      window.location.href = window.location.href;
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-5 text-rose-400 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white mb-2">
              {this.props.fallbackTitle || 'Dashboard could not load'}
            </h1>

            <p className="text-sm text-slate-300 font-medium mb-6">
              A connection or startup issue occurred on this display. Please click Retry to reload the dashboard.
            </p>

            {this.state.error?.message && (
              <div className="w-full bg-slate-950/70 border border-slate-700/60 rounded-lg p-3 text-left mb-6 text-xs text-rose-300 font-mono overflow-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <button
              type="button"
              onClick={this.handleRetry}
              className="w-full py-3.5 px-6 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-extrabold text-base rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ring-2 ring-cyan-400/30"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
