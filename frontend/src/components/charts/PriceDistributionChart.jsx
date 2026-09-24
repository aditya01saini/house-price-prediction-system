import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AXIS_TICK, GRID_STROKE, TOOLTIP_ITEM_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_STYLE } from './chartTheme';
import { formatCompactINR, formatNumber } from '../../utils/format';

/**
 * Price distribution histogram — bins are computed server-side from the
 * actual dataset (analytics.json → price_distribution).
 */
export default function PriceDistributionChart({ bins }) {
  return (
    <ResponsiveContainer width="100%" height={290}>
      <BarChart data={bins} margin={{ top: 8, right: 8, bottom: 24, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ ...AXIS_TICK, fontSize: 10 }}
          interval={1}
          angle={-38}
          textAnchor="end"
          height={56}
          tickLine={false}
        />
        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          cursor={{ fill: 'rgba(148,163,184,0.08)' }}
          formatter={(value) => [`${formatNumber(value)} properties`, 'Count']}
        />
        <Bar dataKey="count" fill="#34d399" radius={[6, 6, 0, 0]} maxBarSize={46} />
      </BarChart>
    </ResponsiveContainer>
  );
}
