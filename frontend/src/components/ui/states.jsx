/** Friendly, actionable error and empty states (no raw backend errors). */

export function ErrorState({ title = 'Could not load data', message, onRetry }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center" role="alert">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-300" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6">
          <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      </span>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {message && <p className="max-w-md text-sm text-slate-400">{message}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 2.6-6.3M3 4v5h5" />
          </svg>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', message, action = null }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-slate-400" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6">
          <path d="M3 7h18M3 12h18M3 17h10" />
        </svg>
      </span>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {message && <p className="max-w-md text-sm text-slate-400">{message}</p>}
      {action}
    </div>
  );
}
