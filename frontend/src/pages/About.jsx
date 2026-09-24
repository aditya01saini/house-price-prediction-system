import { Link } from 'react-router-dom';
import { Card, CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { PIPELINE_STAGES } from '../constants/pipeline';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';

const API_ENDPOINTS = [
  { method: 'GET', path: '/api/health', description: 'Service + model availability probe (200 ok / 503 degraded).' },
  { method: 'GET', path: '/api/model-info', description: 'Feature schema, dataset stats and the prediction form definition.' },
  { method: 'GET', path: '/api/metrics', description: 'MAE / MSE / RMSE / R² for every trained model, from the test set.' },
  { method: 'POST', path: '/api/predict', description: 'Validates a property via Pydantic, runs the saved pipeline, returns the estimated price.' },
  { method: 'GET', path: '/api/analytics', description: 'Chart payloads (distribution, scatter, correlation, city averages, predictions).' },
];

const TECH_STACK = [
  { group: 'Frontend', items: ['React 18', 'Vite', 'Tailwind CSS', 'React Router', 'Axios', 'Recharts'] },
  { group: 'Backend', items: ['Python 3', 'FastAPI', 'Uvicorn', 'Pydantic'] },
  { group: 'Machine Learning', items: ['scikit-learn', 'Pandas', 'NumPy', 'Joblib'] },
  { group: 'Visualisation', items: ['Matplotlib', 'Seaborn', 'Recharts'] },
];

export default function About() {
  const { data: info } = useApi(api.getModelInfo, []);
  const { data: metrics } = useApi(api.getMetrics, []);
  const best = metrics?.best_model;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <header className="text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">Project</span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          About HousePredict AI
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
          An end-to-end House Price Prediction System — dataset to deployed prediction API — built as a
          portfolio-grade demonstration of the complete machine-learning lifecycle.
        </p>
      </header>

      {/* ------------------------------------------------------------ What & why */}
      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader title="What is this project?" />
          <p className="text-sm leading-relaxed text-slate-300">
            HousePredict AI is a full-stack web application that estimates the market price of a residential
            property in INR from its characteristics — area, rooms, floors, parking, age, city and property type.
            A scikit-learn regression pipeline is trained offline, serialised with Joblib and served through a
            FastAPI backend that a React dashboard consumes.
          </p>
        </Card>
        <Card>
          <CardHeader title="Why house-price prediction?" />
          <p className="text-sm leading-relaxed text-slate-300">
            Property prices are a classic tabular-regression problem: features interact (city rates × area × age),
            the target is continuous, and mistakes have real cost — making it ideal for demonstrating rigorous
            cleaning, leakage-aware feature engineering, honest model comparison and production serving.
          </p>
        </Card>
      </section>

      {/* ------------------------------------------------------- Full pipeline */}
      <section id="pipeline" className="mt-14 scroll-mt-24" aria-labelledby="pipeline-heading">
        <div className="text-center">
          <h2 id="pipeline-heading" className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            The ML Pipeline, End to End
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
            Ten stages implemented in <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-emerald-300">backend/ml/</code> and
            reproducible with a single command: <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-emerald-300">python -m ml.train</code>
          </p>
        </div>

        <ol className="relative mx-auto mt-10 max-w-2xl">
          {/* vertical connector */}
          <span className="absolute bottom-6 left-[27px] top-6 w-px bg-gradient-to-b from-emerald-400/50 via-white/10 to-sky-400/40" aria-hidden="true" />
          {PIPELINE_STAGES.map((stage, index) => (
            <li key={stage.title} className="relative flex gap-5 pb-8 last:pb-0">
              <div className="relative z-10 flex flex-col items-center">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/25 bg-slate-900 text-emerald-300 shadow-lg shadow-black/30">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
                    <path d={stage.icon} />
                  </svg>
                </span>
              </div>
              <div className="glass-card flex-1 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300/80">
                    Stage {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-base font-semibold text-white">{stage.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{stage.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* --------------------------------------------------- Models & evaluation */}
      <section className="mt-14 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader title="Which models were tested?" />
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-3">
              <Badge variant="sky">1</Badge>
              <span><strong className="text-white">Linear Regression</strong> — an interpretable baseline that fits a linear relationship between scaled features and price.</span>
            </li>
            <li className="flex items-start gap-3">
              <Badge variant="violet" className="border-violet-400/30 bg-violet-500/10 text-violet-300">2</Badge>
              <span><strong className="text-white">Decision Tree Regressor</strong> — captures non-linear thresholds but tends to overfit single trees.</span>
            </li>
            <li className="flex items-start gap-3">
              <Badge variant="emerald">3</Badge>
              <span><strong className="text-white">Random Forest Regressor</strong> — an ensemble of decorrelated trees; {best ? `it won selection with test R² ${Number(metrics.models.find((m) => m.model === best)?.R2 ?? 0).toFixed(4)}` : 'the strongest test scores'}.</span>
            </li>
          </ul>
        </Card>
        <Card>
          <CardHeader title="How is the model evaluated?" />
          <p className="text-sm leading-relaxed text-slate-300">
            Every candidate is scored on the <strong className="text-white">same 20% held-out test split</strong> using
            four metrics computed from actual predictions:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li><strong className="text-white">MAE</strong> — mean absolute ₹ error per prediction.</li>
            <li><strong className="text-white">MSE</strong> — mean squared error; punishes large misses.</li>
            <li><strong className="text-white">RMSE</strong> — √MSE, back in ₹ for interpretability.</li>
            <li><strong className="text-white">R²</strong> — share of price variance explained (1.0 = perfect).</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Model selection rule: highest test R². See the <Link to="/model" className="text-emerald-300 hover:text-emerald-200">Model Insights</Link> page for live numbers.
          </p>
        </Card>
      </section>

      {/* ------------------------------------------------------------ How ML used */}
      <section className="mt-6">
        <Card>
          <CardHeader
            title="How is machine learning used here?"
            description="Leakage-aware, single-source-of-truth preprocessing."
          />
          <p className="text-sm leading-relaxed text-slate-300">
            The trained object is one scikit-learn <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-emerald-300">Pipeline</code>:
            a custom <em>FeatureEngineer</em> (derives <code className="text-xs text-sky-300">total_rooms</code>,{' '}
            <code className="text-xs text-sky-300">area_per_room</code>, <code className="text-xs text-sky-300">age_group</code>) → a{' '}
            <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-emerald-300">ColumnTransformer</code> (median imputation +
            standard scaling for numericals; most-frequent imputation + one-hot encoding for categoricals) → the regressor.
            Because preprocessing lives <em>inside</em> the saved pipeline, FastAPI replays the identical transformations
            at inference. <code className="text-xs text-rose-300">price_per_sqft</code> is used for EDA only — it is derived from
            the target and would leak at training time.
          </p>
        </Card>
      </section>

      {/* ---------------------------------------------------------------- API list */}
      <section className="mt-6">
        <Card>
          <CardHeader
            title="How the API works"
            description="FastAPI serves the saved pipeline; Pydantic guards the input contract."
          />
          <ul className="space-y-3">
            {API_ENDPOINTS.map((endpoint) => (
              <li key={endpoint.path} className="flex flex-col gap-1.5 rounded-xl border border-white/5 bg-white/[0.03] p-3.5 sm:flex-row sm:items-center sm:gap-4">
                <span className={`inline-flex w-fit items-center rounded-md px-2.5 py-1 text-xs font-bold ${
                  endpoint.method === 'POST' ? 'bg-amber-500/15 text-amber-300' : 'bg-sky-500/15 text-sky-300'
                }`}>
                  {endpoint.method}
                </span>
                <code className="text-sm font-semibold text-emerald-300">{endpoint.path}</code>
                <span className="text-xs text-slate-400 sm:ml-auto sm:text-right">{endpoint.description}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            Interactive docs ship with the backend: open <code className="text-emerald-300">/docs</code> (Swagger UI) on the API origin.
          </p>
        </Card>
      </section>

      {/* -------------------------------------------------- Front ↔ back flow */}
      <section className="mt-6">
        <Card>
          <CardHeader
            title="How the frontend talks to the backend"
            description="A single Axios client, environment-driven base URL, graceful failure everywhere."
          />
          <ol className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
            {[
              'The React form is generated from /api/model-info (no drift between UI and model).',
              'Client-side validation catches bad input before any request.',
              'Axios (src/services/api.js) POSTs the JSON payload to /api/predict.',
              'Pydantic re-validates; invalid data gets a clean 422 with field errors.',
              'The saved pipeline transforms and scores the request in-memory.',
              'The response renders in a result card; toasts and error states handle the rest.',
            ].map((step, i) => (
              <li key={step} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-300">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-slate-500">
            The base URL comes from <code className="text-emerald-300">VITE_API_BASE_URL</code> (see{' '}
            <code className="text-emerald-300">frontend/.env.example</code>) — leaving it empty uses the dev-server
            proxy, so no host is hardcoded anywhere.
          </p>
        </Card>
      </section>

      {/* --------------------------------------------------------- Tech stack */}
      <section className="mt-6">
        <Card>
          <CardHeader title="Tech stack" description="Deliberately minimal — every dependency earns its place." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TECH_STACK.map((group) => (
              <div key={group.group}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{group.group}</h4>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <li key={item} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {info?.dataset?.source && (
            <p className="mt-6 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-3.5 text-xs leading-relaxed text-amber-200/90">
              <strong className="font-semibold">Dataset note:</strong> {info.dataset.source}. To use real data, drop a CSV
              with the same columns into <code>backend/data/house_prices.csv</code> and re-run training — the pipeline,
              metrics and analytics all regenerate automatically.
            </p>
          )}
        </Card>
      </section>
    </div>
  );
}
