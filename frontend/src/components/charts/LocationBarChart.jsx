import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AXIS_TICK, CHART_COLORS, GRID_STROKE, TOOLTIP_ITEM_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_STYLE } from './chartTheme';
import { formatCompactINR, formatNumber } from '../../utils/format';

/**
 * Average price by location — grouped from the real dataset
 * (analytics.json → avg_price_by_location), sorted descending by the backend.
 */
export default function LocationBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(280, data.length * 44 + 60)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 76, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
        <XAxis type="number" tick={AXIS_TICK} tickLine={false} tickFormatter={formatCompactINR} />
        <YAxis
          type="category"
          dataKey="location"
          tick={{ ...AXIS_TICK, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={86}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          cursor={{ fill: 'rgba(148,163,184,0.08)' }}
          formatter={(value, name) =>
            name === 'avg_price' ? [formatINR(value), 'Average price'] : [formatNumber(value), 'Listings']
          }
        />
        <Bar dataKey="avg_price" radius={[0, 6, 6, 0]} maxBarSize={26}>
          {data.map((entry, i) => (
            <Cell key={entry.location} fill={i === 0 ? CHART_COLORS.emerald : '#0d9488'} fillOpacity={1 - i * 0.09} />
          ))}
          <LabelList
            dataKey="avg_price"
            position="right"
            formatter={formatCompactINR}
            style={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
