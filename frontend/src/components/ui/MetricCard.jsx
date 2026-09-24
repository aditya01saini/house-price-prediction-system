import { SkeletonCard } from './Spinner';

/**
 * Dashboard/insights metric card.
 * Values always arrive from the backend (/api/model-info, /api/metrics) —
 * while loading a skeleton is shown, never a fake number.
 */
export default function MetricCard({ icon, label, value, sub, loading = false, accent = 'emerald' }) {
  const accents = {
    emerald: 'bg-emerald-500/10 text-emerald-300',
    sky: 'bg-sky-500/10 text-sky-300',
    amber: 'bg-amber-500/10 text-amber-300',
    violet: 'bg-violet-500/10 text-violet-300',
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
        {icon && (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accents[accent]}`} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      {loading ? (
        <SkeletonCard className="mt-3 h-8" />
      ) : (
        <p className="mt-2 truncate text-2xl font-bold tracking-tight text-white" title={typeof value === 'string' ? value : undefined}>
          {value}
        </p>
      )}
      {sub && !loading && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
