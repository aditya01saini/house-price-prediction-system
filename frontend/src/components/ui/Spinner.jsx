/** Accessible loading spinner (size: 'sm' | 'md' | 'lg'). */

const SIZES = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };

export function Spinner({ size = 'md', className = '' }) {
  return (
    <svg
      className={`animate-spin text-emerald-400 ${SIZES[size] || SIZES.md} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Full-page centered loader with label. */
export function PageLoader({ label = 'Loading data…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24" role="status" aria-live="polite">
      <Spinner size="lg" />
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}

/** Card-shaped shimmering placeholder used while metrics load. */
export function SkeletonCard({ className = 'h-28' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}
