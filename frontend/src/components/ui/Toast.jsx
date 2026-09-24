import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

/**
 * Lightweight toast notifications.
 * Usage: const toast = useToast(); toast.success('Saved'); toast.error('Failed');
 * Rendered as an aria-live region so screen readers announce updates.
 */

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: { icon: 'M9 12.5l2 2 4-4.5', ring: 'border-emerald-400/30 bg-emerald-500/10', accent: 'text-emerald-300' },
  error: { icon: 'M12 8v5m0 3.5h.01', ring: 'border-rose-400/30 bg-rose-500/10', accent: 'text-rose-300' },
  info: { icon: 'M12 8h.01M12 11.5V16', ring: 'border-sky-400/30 bg-sky-500/10', accent: 'text-sky-300' },
};

function ToastItem({ toast, onDismiss }) {
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-xl shadow-black/30 backdrop-blur-md transition-all duration-300 ${style.ring} ${
        toast.leaving ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`mt-0.5 h-4 w-4 shrink-0 ${style.accent}`}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d={style.icon} />
      </svg>
      <p className="flex-1 text-sm text-slate-100">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="rounded-md p-1 text-slate-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message, duration = 4200) => {
      const id = ++idRef.current;
      setToasts((list) => [...list.slice(-3), { id, type, message }]);
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      success: (msg, duration) => push('success', msg, duration),
      error: (msg, duration) => push('error', msg, duration || 6000),
      info: (msg, duration) => push('info', msg, duration),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-end gap-2 sm:bottom-6 sm:right-6 sm:left-auto"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
