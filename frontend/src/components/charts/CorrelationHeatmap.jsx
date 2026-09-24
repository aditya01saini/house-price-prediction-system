import { formatNumber } from '../../utils/format';

/**
 * Correlation heatmap (custom CSS grid — every cell shows the real Pearson
 * correlation between two numeric features, computed server-side).
 * Green = positive correlation, rose = negative; intensity = magnitude.
 */

function cellColor(value) {
  const alpha = 0.12 + 0.78 * Math.min(Math.abs(value), 1);
  return value >= 0 ? `rgba(52, 211, 153, ${alpha})` : `rgba(251, 113, 133, ${alpha})`;
}

export default function CorrelationHeatmap({ columns, matrix }) {
  const n = columns.length;

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div
          className="grid min-w-[560px] gap-1"
          style={{ gridTemplateColumns: `${Math.max(72, n * 8)}px repeat(${n}, minmax(64px, 1fr))` }}
          role="table"
          aria-label="Feature correlation matrix"
        >
          {/* header row */}
          <div />
          {columns.map((col) => (
            <div key={col} className="truncate px-1 pb-1 text-center text-[10px] font-medium uppercase tracking-wide text-slate-400" title={col}>
              {col}
            </div>
          ))}
          {/* matrix rows */}
          {matrix.map((row, i) => (
            <div key={columns[i]} className="contents" role="row">
              <div className="truncate pr-2 text-right text-[11px] font-medium text-slate-400" role="rowheader" title={columns[i]}>
                {columns[i]}
              </div>
              {row.map((value, j) => (
                <div
                  key={`${i}-${j}`}
                  role="cell"
                  title={`${columns[i]} vs ${columns[j]}: r = ${value}`}
                  className="flex h-11 items-center justify-center rounded-md text-[11px] font-semibold text-slate-950/80 transition-transform duration-100 hover:scale-[1.06]"
                  style={{ backgroundColor: cellColor(value) }}
                >
                  {value.toFixed(2)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* legend */}
      <div className="mt-4 flex items-center justify-center gap-3 text-xs text-slate-400">
        <span>−1</span>
        <span className="h-2 w-40 rounded-full" style={{ background: 'linear-gradient(90deg, rgba(251,113,133,0.9), rgba(30,41,59,0.6), rgba(52,211,153,0.9))' }} aria-hidden="true" />
        <span>+1</span>
        <span className="ml-2">Pearson r — {formatNumber(n)}×{formatNumber(n)} matrix</span>
      </div>
    </div>
  );
}
