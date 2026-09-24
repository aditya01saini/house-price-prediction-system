import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import MetricCard from '../components/ui/MetricCard';
import { PageLoader } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/states';
import { Card, CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { ErrorComparisonChart, R2ComparisonChart } from '../components/charts/ModelComparisonChart';
import { formatCompactINR } from '../utils/format';
import { getApiErrorMessage } from '../services/api';

const METRIC_INFO = {
  MAE: {
    label: 'MAE',
    full: 'Mean Absolute Error',
    hint: 'Average ₹ miss per prediction — lower is better.',
  },
  MSE: {
    label: 'MSE',
    full: 'Mean Squared Error',
    hint: 'Mean of squared ₹ errors — heavily penalises large misses. Lower is better.',
  },
  RMSE: {
    label: 'RMSE',
    full: 'Root Mean Squared Error',
    hint: 'Square root of MSE, back in ₹ — lower is better.',
  },
  R2: {
    label: 'R² Score',
    full: 'Coefficient of Determination',
    hint: 'Share of price variance explained — higher is better (max 1.0).',
  },
};

function fmtMetric(name, value) {
  if (value === null || value === undefined) return '—';
  if (name === 'R2') return Number(value).toFixed(4);
  if (name === 'MSE') return formatCompactINR(value);
  return formatCompactINR(value);
}

export default function ModelInsights() {
  const { data: metrics, loading, error, refetch } = useApi(api.getMetrics, []);
  const { data: info } = useApi(api.getModelInfo, []);

  if (loading) return <PageLoader label="Loading model metrics…" />;

  if (error || !metrics) {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
        <ErrorState
          title="Model metrics unavailable"
          message={getApiErrorMessage(error)}
          onRetry={refetch}
        />
      </div>
    );
  }

  const best = metrics.best_model;
  const bestStats = metrics.models.find((m) => m.model === best);
  const featureCount = info?.features?.count;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <header className="text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">Machine Learning</span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Model Insights</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
          How the valuation model was trained, compared and selected — every number below is computed from the
          held-out test set, not estimated.
        </p>
      </header>

      {/* ------------------------------------------------------- Key figures */}
      <section aria-label="Selected model summary" className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Selected Model"
          value={best}
          sub="highest test R²"
          accent="emerald"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4"><path d="M8 21h8m-4-4v4M6 3h12v6a6 6 0 0 1-12 0V3Z" /></svg>}
        />
        <MetricCard
          label="Training Samples"
          value={metrics.n_train?.toLocaleString('en-IN')}
          sub={`${((1 - metrics.test_size) * 100).toFixed(0)}% of cleaned data`}
          accent="sky"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" /></svg>}
        />
        <MetricCard
          label="Testing Samples"
          value={metrics.n_test?.toLocaleString('en-IN')}
          sub={`${(metrics.test_size * 100).toFixed(0)}% held-out set`}
          accent="violet"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4"><path d="M9 3v6a3 3 0 1 1-6 0V3m3 0v18M18 3c-1.7 0-3 1.8-3 4s1.3 4 3 4v10" /></svg>}
        />
        <MetricCard
          label="Features"
          value={featureCount ? `${featureCount}` : '—'}
          sub="numerical + one-hot categorical"
          accent="amber"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M4 6h16M4 12h16M4 18h10" /></svg>}
        />
      </section>

      {/* -------------------------------------------------- Best model score */}
      <section aria-label="Best model metrics" className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Object.entries(METRIC_INFO).map(([key, meta]) => (
          <Card key={key} className="!p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{meta.label}</p>
              <span className="group relative" tabIndex={0} title={meta.hint} aria-label={`${meta.full}: ${meta.hint}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5 text-slate-500"><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M12 11.5V16" /></svg>
                <span role="tooltip" className="pointer-events-none absolute right-0 top-full z-40 mt-1 w-52 rounded-lg border border-white/10 bg-slate-900 p-2.5 text-xs text-slate-200 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {meta.hint}
                </span>
              </span>
            </div>
            <p className="mt-2 text-xl font-bold text-white">
              {fmtMetric(key, bestStats?.[key])}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">{meta.full}</p>
          </Card>
        ))}
      </section>

      {/* ------------------------------------------------------ Comparison charts */}
      <section aria-labelledby="comparison-heading" className="mt-12">
        <h2 id="comparison-heading" className="text-xl font-bold tracking-tight text-white">
          Model comparison
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          All three candidates evaluated on the identical {metrics.n_test?.toLocaleString('en-IN')}-row test split
          (seed {metrics.random_state}).
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="R² score (higher is better)" description="Variance of price explained by each model." />
            <R2ComparisonChart models={metrics.models} />
          </Card>
          <Card>
            <CardHeader title="Error metrics in ₹ (lower is better)" description="MAE vs RMSE — RMSE rises faster when large misses occur." />
            <ErrorComparisonChart models={metrics.models} />
          </Card>
        </div>

        {/* ------------------------------------------------- Comparison table */}
        <Card className="mt-6 overflow-x-auto">
          <CardHeader title="Full evaluation table" description="Exact values from ml/evaluate.py on the test set." />
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">Regression metrics for all trained models</caption>
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                <th scope="col" className="py-3 pr-4 font-medium">Model</th>
                <th scope="col" className="py-3 pr-4 font-medium">MAE (₹)</th>
                <th scope="col" className="py-3 pr-4 font-medium">MSE (₹²)</th>
                <th scope="col" className="py-3 pr-4 font-medium">RMSE (₹)</th>
                <th scope="col" className="py-3 pr-4 font-medium">R²</th>
                <th scope="col" className="py-3 font-medium">Fit time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {metrics.models.map((model) => {
                const isBest = model.model === best;
                return (
                  <tr key={model.model} className={isBest ? 'bg-emerald-500/[0.07]' : ''}>
                    <th scope="row" className="py-3 pr-4 font-semibold text-white">
                      <span className="inline-flex items-center gap-2">
                        {model.model}
                        {isBest && <Badge variant="emerald">Selected</Badge>}
                      </span>
                    </th>
                    <td className="py-3 pr-4 text-slate-300">{model.MAE?.toLocaleString('en-IN')}</td>
                    <td className="py-3 pr-4 text-slate-300">{model.MSE?.toLocaleString('en-IN')}</td>
                    <td className="py-3 pr-4 text-slate-300">{model.RMSE?.toLocaleString('en-IN')}</td>
                    <td className="py-3 pr-4 font-semibold text-emerald-300">{Number(model.R2).toFixed(4)}</td>
                    <td className="py-3 text-slate-400">{model.fit_seconds?.toFixed(2)}s</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* -------------------------------------------------------- Explainer */}
        <div className="glass-card mt-6 flex gap-4 p-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4.5 w-4.5 h-5 w-5"><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M12 11.5V16" /></svg>
          </span>
          <p className="text-sm leading-relaxed text-slate-300">
            <span className="font-semibold text-white">How to read these metrics: </span>
            Lower MAE, MSE and RMSE indicate smaller prediction errors, while a higher R² indicates that the model
            explains more variance in the target. {best} achieved the best balance on every measure here, which is why
            it was selected to serve predictions.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Want the data behind these charts? Open the{' '}
          <Link to="/analytics" className="font-medium text-emerald-300 hover:text-emerald-200">Analytics page</Link>.
        </p>
      </section>
    </div>
  );
}
