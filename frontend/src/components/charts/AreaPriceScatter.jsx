import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { AXIS_TICK, GRID_STROKE, SERIES_COLORS, TOOLTIP_ITEM_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_STYLE } from './chartTheme';
import { formatCompactINR, formatINR } from '../../utils/format';
import { formatNumber } from "../../utils/format";
/**
 * Area vs Price scatter — one series per property type, from the real dataset
 * (analytics.json → area_vs_price.points).
 */
export default function AreaPriceScatter({ points }) {
  const byType = points.reduce((acc, p) => {
    (acc[p.property_type] = acc[p.property_type] || []).push(p);
    return acc;
  }, {});
  const types = Object.keys(byType);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 8, right: 12, bottom: 8, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
        <XAxis
          type="number"
          dataKey="area"
          name="Area"
          tick={AXIS_TICK}
          tickLine={false}
          tickFormatter={(v) => `${formatNumber(v)} ft²`}
        />
        <YAxis
          type="number"
          dataKey="price"
          name="Price"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={70}
          tickFormatter={formatCompactINR}
        />
        <ZAxis range={[36, 36]} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          cursor={{ strokeDasharray: '3 3', stroke: '#475569' }}
          formatter={(value, name) => (name === 'Price' ? [formatINR(value), name] : [`${formatNumber(value)} ft²`, name])}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
        {types.map((type, i) => (
          <Scatter
            key={type}
            name={type}
            data={byType[type]}
            fill={SERIES_COLORS[i % SERIES_COLORS.length]}
            fillOpacity={0.65}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
