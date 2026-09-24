/**
 * Keyboard-accessible tooltip hint (a "?" next to form labels).
 * Shows on hover AND on keyboard focus, and carries a native title fallback.
 */
export default function InfoHint({ text }) {
  return (
    <span className="group relative ml-1 inline-flex" tabIndex={0} aria-label={`Hint: ${text}`} title={text}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="h-3.5 w-3.5 text-slate-500 transition-colors group-hover:text-emerald-300 group-focus-visible:text-emerald-300"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8h.01M12 11.5V16" />
      </svg>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 w-52 -translate-x-1/2 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs leading-relaxed text-slate-200 opacity-0 shadow-xl shadow-black/40 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
