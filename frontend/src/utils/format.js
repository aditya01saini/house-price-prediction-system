/**
 * Indian Rupee formatting helpers (the model predicts prices in INR).
 */

/** ₹82,50,000 style full grouping. */
export function formatINR(value, { maximumFractionDigits = 0 } = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits,
  }).format(Number(value));
}

/** Compact chart-axis style: ₹1.15 Cr / ₹45.0 L / ₹90 k. */
export function formatCompactINR(value) {
  const v = Number(value);
  if (Number.isNaN(v)) return '—';
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)} L`;
  if (Math.abs(v) >= 1e3) return `₹${(v / 1e3).toFixed(0)} k`;
  return `₹${v.toFixed(0)}`;
}

/** en-IN digit grouping without currency symbol. */
export function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-IN').format(Number(value));
}
