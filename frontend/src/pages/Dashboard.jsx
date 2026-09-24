import { Link } from 'react-router-dom';
import { api, getApiErrorMessage } from '../services/api';
import { useApi } from '../hooks/useApi';
import MetricCard from '../components/ui/MetricCard';
import { ErrorState } from '../components/ui/states';
import SectionHeading from '../components/ui/SectionHeading';
import { DASHBOARD_STAGES } from '../constants/pipeline';
import { formatCompactINR } from '../utils/format';

const TechChip = ({ children }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
    {children}
  </span>
);

export default function Dashboard() {
  const modelInfo = useApi(api.getModelInfo);
  const metrics = useApi(api.getMetrics);

  const ready = Boolean(modelInfo.data && metrics.data);
  const hasError = Boolean(modelInfo.error || metrics.error);

  const dataset = modelInfo.data?.dataset;
  const featureCount = modelInfo.data?.features?.count;
  const bestModel = metrics.data?.best_model;
  const bestStats = bestModel
    ? metrics.data.models.find((m) => m.model === bestModel)
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      {/* ---------------------------------------------------------------- Hero */}
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
              <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />
            </svg>
            Machine Learning · FastAPI · React
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Predict Property Prices with <span className="text-gradient">Machine Learning</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Estimate property values using data-driven machine learning models — trained on thousands of real
            property records, evaluated with MAE, MSE, RMSE and R², and served through a production-style API.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/predict" className="btn-primary px-6 py-3 text-base">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                <path d="M3 11l9-8 9 8M5 9.5V21h14V9.5" />
              </svg>
              Predict House Price
            </Link>
            <Link to="/model" className="btn-secondary px-6 py-3 text-base">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
                <path d="M4 19h16M7 16v-5m5 5V7m5 9v-3" />
              </svg>
              Explore Model
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            <TechChip>scikit-learn Pipeline</TechChip>
            <TechChip>Joblib-served model</TechChip>
            <TechChip>Real test-set metrics</TechChip>
          </div>
        </div>

        {/* Hero visual with a LIVE metric chip pulled from the backend */}
        <div className="relative">
          <div className="glass-card overflow-hidden p-2">
            <img
              src="/hero-house.jpg"
              alt="Modern premium residential apartment building at dusk"
              className="h-64 w-full rounded-xl object-cover sm:h-80 lg:h-[22rem]"
              loading="eager"
            />
          </div>

          <div className="glass-card absolute -bottom-5 left-4 flex items-center gap-3 px-4 py-3 sm:left-8">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
                <path d="M4 19h16M7 16v-5m5 5V7m5 9v-3" />
              </svg>
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400">Best model R² (test)</p>
              <p className="text-lg font-bold text-white">
                {bestStats ? Number(bestStats.R2).toFixed(4) : '—'}
                {bestStats && <span className="ml-1.5 text-xs font-medium text-slate-400">RMSE {formatCompactINR(bestStats.RMSE)}</span>}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Metric cards */}
      <section aria-label="Key figures" className="mt-16">
        {hasError && !ready ? (
          <ErrorState
            title="Backend not reachable"
            message={getApiErrorMessage(metrics.error || modelInfo.error)}
            onRetry={() => {
              modelInfo.refetch();
              metrics.refetch();
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                loading={!ready}
                label="Dataset Records"
                value={dataset ? dataset.records_clean?.toLocaleString('en-IN') : '—'}
                sub={dataset ? `${dataset.records_raw?.toLocaleString('en-IN')} raw → cleaned` : ''}
                accent="sky"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" /></svg>}
              />
              <MetricCard
                loading={!ready}
                label="Features Used"
                value={featureCount ? `${featureCount}` : '—'}
                sub="8 raw + 3 engineered"
                accent="violet"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M8 9l-4 3 4 3m8-6 4 3-4 3M13 5l-2 14" /></svg>}
              />
              <MetricCard
                loading={!ready}
                label="Best Model"
                value={bestModel || '—'}
                sub="selected on test R²"
                accent="emerald"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0 0v6m-3 3h6" /></svg>}
              />
              <MetricCard
                loading={!ready}
                label="R² Score"
                value={bestStats ? Number(bestStats.R2).toFixed(4) : '—'}
                sub="variance explained (test set)"
                accent="amber"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4"><path d="M9 12.5l2 2 4-4.5M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z" /></svg>}
              />
            </div>

            {dataset && (
              <p className="mt-3 text-center text-xs text-slate-500">
                Cleaning summary: {dataset.duplicates_removed} duplicates removed · {dataset.invalid_rows_removed} invalid rows
                dropped · prices ₹{dataset.price_min?.toLocaleString('en-IN')} – ₹{dataset.price_max?.toLocaleString('en-IN')}
                {' '}· {dataset.n_locations} cities
              </p>
            )}
          </>
        )}
      </section>

      {/* ------------------------------------------------------ Pipeline strip */}
      <section className="mt-20" aria-labelledby="pipeline-strip">
        <SectionHeading
          eyebrow="ML Pipeline"
          title="From raw records to live predictions"
          description="A complete scikit-learn lifecycle runs before any price is shown. Every stage is implemented in backend/ml/ and reproducible with one command."
        />
        <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {DASHBOARD_STAGES.map((stage, index) => (
            <li key={stage.title} className="glass-card group p-5 transition-colors duration-200 hover:border-emerald-400/30">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d={stage.icon} />
                  </svg>
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Step {index + 1}</p>
                  <h3 className="text-sm font-semibold text-white">{stage.title}</h3>
                </div>
              </div>
              <p className="mt-3 line-clamp-4 text-xs leading-relaxed text-slate-400">{stage.description}</p>
            </li>
          ))}
        </ol>
        <div className="mt-5 text-center">
          <Link to="/about#pipeline" className="text-sm font-medium text-emerald-300 transition-colors hover:text-emerald-200">
            See the full 10-stage pipeline →
          </Link>
        </div>
      </section>

      {/* ----------------------------------------------------------------- CTA */}
      <section className="glass-card mt-20 overflow-hidden">
        <div className="relative flex flex-col items-center gap-6 p-10 text-center sm:p-14">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-sky-500/10" aria-hidden="true" />
          <h2 className="relative text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Ready to value a property?
          </h2>
          <p className="relative max-w-xl text-sm text-slate-400 sm:text-base">
            Enter area, rooms, age and location — the trained pipeline handles cleaning, feature engineering and
            encoding automatically before the {bestModel || 'model'} estimates the price.
          </p>
          <Link to="/predict" className="btn-primary relative px-7 py-3 text-base">
            Predict Now
          </Link>
        </div>
      </section>
    </div>
  );
}
