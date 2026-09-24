import { useEffect, useMemo, useRef, useState } from 'react';
import { api, getApiErrorMessage } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/ui/Toast';
import { PageLoader } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/states';
import FormField from '../components/form/FormField';
import ResultCard from '../components/predict/ResultCard';
import { formatINR } from '../utils/format';

/**
 * House Price Prediction page.
 *
 * The form is generated from the backend's /api/model-info payload
 * (prediction_inputs), validated client-side, then POSTed to /api/predict.
 * The displayed price always comes from the trained pipeline — no mock data.
 */

function buildInitialState(inputs) {
  const state = {};
  for (const field of inputs) {
    if (field.type === 'select') state[field.name] = field.options?.[0] ?? '';
    else state[field.name] = '';
  }
  return state;
}

function validate(values, inputs) {
  const errors = {};
  for (const field of inputs) {
    const raw = values[field.name];
    if (raw === '' || raw === null || raw === undefined) {
      errors[field.name] = `${field.label} is required.`;
      continue;
    }
    if (field.type === 'select') {
      if (!field.options?.includes(raw)) {
        errors[field.name] = `Choose a valid ${field.label.toLowerCase()}.`;
      }
      continue;
    }
    const num = Number(raw);
    if (Number.isNaN(num)) {
      errors[field.name] = `${field.label} must be a number.`;
    } else if (!Number.isFinite(num)) {
      errors[field.name] = `${field.label} is out of range.`;
    } else if (field.min !== undefined && num < field.min) {
      errors[field.name] = `${field.label} must be at least ${field.min}${field.unit ? ` ${field.unit}` : ''}.`;
    } else if (field.max !== undefined && num > field.max) {
      errors[field.name] = `${field.label} cannot exceed ${field.max}${field.unit ? ` ${field.unit}` : ''}.`;
    }
  }
  return errors;
}

function toPayload(values, inputs) {
  const payload = {};
  for (const field of inputs) {
    payload[field.name] = field.type === 'select' ? values[field.name] : Number(values[field.name]);
  }
  return payload;
}

export default function Predict() {
  const toast = useToast();
  const { data: info, loading, error, refetch } = useApi(api.getModelInfo, []);

  const inputs = useMemo(() => info?.prediction_inputs ?? [], [info]);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [recent, setRecent] = useState([]);
  const resultRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (info && inputs.length && form === null) {
      setForm(buildInitialState(inputs));
    }
  }, [info, inputs, form]);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear an existing error as soon as the user edits the field again.
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleBlur = (name) => {
    if (!form) return;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldErrors = validate(form, inputs);
    setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form || submitting) return;

    const fieldErrors = validate(form, inputs);
    setErrors(fieldErrors);
    setTouched(Object.fromEntries(inputs.map((f) => [f.name, true])));

    if (Object.keys(fieldErrors).length > 0) {
      toast.error('Please fix the highlighted fields before predicting.');
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      const data = await api.predictPrice(toPayload(form, inputs));
      setResult(data);
      setRecent((list) => [{ id: Date.now(), ...data }, ...list].slice(0, 4));
      toast.success('Price prediction generated successfully.');
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm(buildInitialState(inputs));
    setErrors({});
    setTouched({});
    setResult(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ---------------------------------------------------------------- states
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-6">
        <PageLoader label="Loading model schema…" />
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-6">
        <ErrorState
          title="Prediction form unavailable"
          message={getApiErrorMessage(error)}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <header className="text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">Valuation Engine</span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">House Price Prediction</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400 sm:text-base">
          Enter property details to estimate its market value. Fields are generated from the trained model's
          feature schema.
        </p>
      </header>

      <div className="mt-10 grid gap-8" ref={formRef}>
        {/* ------------------------------------------------------ Input form */}
        <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
          <fieldset disabled={submitting} className="glass-card p-6 sm:p-8">
            <legend className="sr-only">Property details</legend>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {inputs.map((field) => (
                <FormField
                  key={field.name}
                  config={field}
                  value={form ? form[field.name] : ''}
                  error={touched[field.name] ? errors[field.name] : undefined}
                  onChange={handleChange}
                  onBlur={() => handleBlur(field.name)}
                  disabled={submitting}
                />
              ))}
            </div>

            <button
              type="submit"
              className="btn-primary mt-8 w-full py-3 text-base"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 animate-spin" role="status" aria-label="Predicting">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="4" />
                    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  Analyzing Property…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                    <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />
                  </svg>
                  Predict Price
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">
              Served by the saved scikit-learn pipeline via POST /api/predict — nothing is hardcoded.
            </p>
          </fieldset>
        </form>

        {/* ---------------------------------------------------------- Result */}
        <div ref={resultRef} aria-live="polite">
          {submitting && (
            <div className="glass-card flex flex-col items-center gap-4 p-12 text-center">
              <span className="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
                  <path d="M3 11l9-8 9 8M5 9.5V21h14V9.5" />
                </svg>
              </span>
              <p className="text-base font-semibold text-white">Analyzing Property…</p>
              <p className="max-w-sm text-sm text-slate-400">
                Running feature engineering, encoding and the trained model on your inputs.
              </p>
            </div>
          )}

          {!submitting && result && (
            <ResultCard result={result} inputsConfig={inputs} onReset={resetForm} />
          )}
        </div>

        {/* --------------------------------------------- Recent (this session) */}
        {!submitting && recent.length > 0 && (
          <section aria-labelledby="recent-heading" className="glass-card p-6">
            <div className="flex items-center justify-between">
              <h2 id="recent-heading" className="text-sm font-semibold text-white">
                Recent predictions <span className="ml-1 font-normal text-slate-500">(this browser session)</span>
              </h2>
              <button
                type="button"
                onClick={() => setRecent([])}
                className="text-xs font-medium text-slate-400 transition-colors hover:text-rose-300"
              >
                Clear
              </button>
            </div>
            <ul className="mt-4 divide-y divide-white/5">
              {recent.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span className="text-slate-300">
                    {item.inputs.location} · {item.inputs.property_type} · {item.inputs.area} ft² · {item.inputs.bedrooms} BHK
                  </span>
                  <span className="font-semibold text-emerald-300">{formatINR(item.predicted_price)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
