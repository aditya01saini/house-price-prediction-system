/** Small inline status/badge pill. */
const VARIANTS = {
  emerald: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
  sky: 'border-sky-400/30 bg-sky-500/10 text-sky-300',
  amber: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
  slate: 'border-white/15 bg-white/5 text-slate-300',
};

export default function Badge({ children, variant = 'slate', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  );
}
