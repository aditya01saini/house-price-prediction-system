import InfoHint from '../ui/InfoHint';

/**
 * Data-driven form control. Field configuration (label, unit, type, bounds,
 * dropdown options) comes from the backend's /api/model-info payload, so the
 * form always matches the trained model's features.
 */
export default function FormField({ config, value, error, onChange, onBlur, disabled = false }) {
  const { name, label, unit, type, min, max, step, options, hint } = config;
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center">
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {label}
          {unit && <span className="ml-1 text-xs font-normal text-slate-500">({unit})</span>}
        </label>
        {hint && <InfoHint text={hint} />}
      </div>

      {type === 'select' ? (
        <select
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`input-base appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10 ${error ? 'input-error' : ''}`}
        >
          {(options || []).map((option) => (
            <option key={option} value={option} className="bg-slate-900">
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={name}
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          max={max}
          step={step}
          placeholder={min !== undefined ? `${min} – ${max}` : ''}
          onChange={(e) => onChange(name, e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`input-base ${error ? 'input-error' : ''}`}
        />
      )}

      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1 text-xs font-medium text-rose-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
