import {
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { AXIS_TICK, GRID_STROKE, TOOLTIP_ITEM_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_STYLE } from './chartTheme';
import { formatCompactINR, formatINR } from '../../utils/format';

/**
 * Actual vs Predicted prices on the held-out test set, with a perfect-
 * prediction reference line (analytics.json → actual_vs_predicted).
 */
export default function ActualVsPredictedChart({ points, r2 }) {
  const refLine = [Math.min(...points.map((p) => p.actual)), Math.max(...points.map((p) => p.actual))];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 8, right: 12, bottom: 8, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
        <XAxis
          type="number"
          dataKey="actual"
          name="Actual"
          tick={AXIS_TICK}
          tickLine={false}
          domain={['auto', 'auto']}
          tickFormatter={formatCompactINR}
        />
        <YAxis
          type="number"
          dataKey="predicted"
          name="Predicted"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={70}
          domain={['auto', 'auto']}
          tickFormatter={formatCompactINR}
        />
        <ZAxis range={[30, 30]} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          cursor={{ strokeDasharray: '3 3', stroke: '#475569' }}
          formatter={(value, name) => [formatINR(value), name === 'actual' ? 'Actual' : 'Predicted']}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
        <Scatter name={`Test properties${r2 !== undefined ? ` (test R² = ${Number(r2).toFixed(3)})` : ''}`} data={points} fill="#38bdf8" fillOpacity={0.55} />
        <ReferenceLine
          segment={[
            { actual: refLine[0], predicted: refLine[0] },
            { actual: refLine[1], predicted: refLine[1] },
          ]}
          stroke="#fbbf24"
          strokeDasharray="6 4"
          label={{ value: 'Perfect prediction', fill: '#fbbf24', fontSize: 11, position: 'insideBottomRight' }}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
