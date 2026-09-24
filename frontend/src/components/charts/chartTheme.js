/** Shared Recharts theming for the dark dashboard. */

export const CHART_COLORS = {
  emerald: '#34d399',
  teal: '#2dd4bf',
  sky: '#38bdf8',
  amber: '#fbbf24',
  violet: '#a78bfa',
  rose: '#fb7185',
  slate: '#94a3b8',
};

export const SERIES_COLORS = [CHART_COLORS.emerald, CHART_COLORS.sky, CHART_COLORS.amber];

export const GRID_STROKE = 'rgba(148, 163, 184, 0.14)';

export const AXIS_TICK = { fill: '#94a3b8', fontSize: 11 };

export const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(2, 6, 23, 0.95)',
  border: '1px solid rgba(148, 163, 184, 0.25)',
  borderRadius: 12,
  color: '#e2e8f0',
  fontSize: 12,
  boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
};

export const TOOLTIP_ITEM_STYLE = { color: '#e2e8f0' };

export const TOOLTIP_LABEL_STYLE = { color: '#64748b', fontWeight: 600 };
