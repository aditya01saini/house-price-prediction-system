import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AXIS_TICK, CHART_COLORS, GRID_STROKE, TOOLTIP_ITEM_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_STYLE } from './chartTheme';
import { formatCompactINR } from '../../utils/format';

const MODEL_FILL = {
  'Linear Regression': '#38bdf8',
  'Decision Tree': '#a78bfa',
  'Random Forest': '#34d399',
};

/**
 * R² comparison across the three trained models (metrics.json → models).
 * Higher is better; values are real test-set scores.
 */
export function R2ComparisonChart({ models }) {
  const data = models.map((m) => ({ model: m.model, R2: m.R2 }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="model" tick={{ ...AXIS_TICK, fontSize: 11 }} tickLine={false} />
        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} domain={[0, 1]} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          cursor={{ fill: 'rgba(148,163,184,0.08)' }}
          formatter={(value) => [`${Number(value).toFixed(4)}`, 'R² score']}
        />
        <Bar dataKey="R2" radius={[6, 6, 0, 0]} maxBarSize={72}>
          {data.map((entry) => (
            <Cell key={entry.model} fill={MODEL_FILL[entry.model] || CHART_COLORS.emerald} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Error metrics comparison (MAE & RMSE in ₹, from the real test set).
 * Lower is better.
 */
export function ErrorComparisonChart({ models }) {
  const data = models.map((m) => ({ model: m.model, MAE: m.MAE, RMSE: m.RMSE }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="model" tick={{ ...AXIS_TICK, fontSize: 11 }} tickLine={false} />
        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={70} tickFormatter={formatCompactINR} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          cursor={{ fill: 'rgba(148,163,184,0.08)' }}
          formatter={(value, name) => [formatCompactINR(value), name === 'MAE' ? 'MAE (₹)' : 'RMSE (₹)']}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
        <Bar dataKey="MAE" fill="#38bdf8" radius={[6, 6, 0, 0]} maxBarSize={30} />
        <Bar dataKey="RMSE" fill="#fbbf24" radius={[6, 6, 0, 0]} maxBarSize={30} />
      </BarChart>
    </ResponsiveContainer>
  );
}
