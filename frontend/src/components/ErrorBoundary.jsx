import { Component } from 'react';

/**
 * Top-level error boundary — a rendering crash shows a friendly card instead
 * of a blank page, with a safe recovery action.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Frontend-only telemetry hook; keep console for debugging in dev.
    console.error('UI crashed:', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
          <div className="glass-card w-full max-w-md p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6" aria-hidden="true">
                <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              </svg>
            </div>
            <h1 className="mt-4 text-lg font-semibold text-white">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-400">
              The interface hit an unexpected error. Reloading usually fixes it — your data was not lost on the server.
            </p>
            <button type="button" onClick={this.handleReload} className="btn-primary mt-6">
              Reload application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
