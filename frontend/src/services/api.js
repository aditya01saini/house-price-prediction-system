import axios from 'axios';

/**
 * Centralised API client for the HousePredict AI backend.
 *
 * - Base URL comes from the VITE_API_BASE_URL environment variable.
 * - When it is empty (default) requests use same-origin relative URLs, which
 *   the Vite dev server proxies to the FastAPI backend — no hardcoded hosts.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

const unwrap = (promise) => promise.then((response) => response.data);

export const api = {
  /** GET /api/health — service + model availability */
  getHealth: () => unwrap(apiClient.get('/health')),

  /** GET /api/model-info — features, options and input schema */
  getModelInfo: () => unwrap(apiClient.get('/model-info')),

  /** GET /api/metrics — per-model MAE/MSE/RMSE/R² on the test set */
  getMetrics: () => unwrap(apiClient.get('/metrics')),

  /** GET /api/analytics — real chart data computed from the dataset */
  getAnalytics: () => unwrap(apiClient.get('/analytics')),

  /** POST /api/predict — run the trained pipeline on property details */
  predictPrice: (payload) => unwrap(apiClient.post('/predict', payload)),
};

/**
 * Convert any Axios/network error into a short, user-friendly message.
 * Raw backend internals (stack traces etc.) are never surfaced.
 */
export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response) {
    const { status, data } = error.response;

    if (data && typeof data === 'object') {
      if (data.message) {
        const fieldErrors = Array.isArray(data.errors)
          ? data.errors.map((e) => e?.message).filter(Boolean)
          : [];
        if (fieldErrors.length) {
          const extra = fieldErrors.slice(0, 2).join('; ');
          return fieldErrors.length > 2 ? `${data.message} (${extra}…)` : `${data.message} (${extra})`;
        }
        return data.message;
      }
      if (typeof data.detail === 'string') return data.detail;
    }

    if (status === 404) return 'The requested resource was not found.';
    if (status >= 500) return 'The server hit an unexpected error. Please try again shortly.';
    return `Request failed (HTTP ${status}).`;
  }

  if (error?.request) {
    return 'Cannot reach the backend server. Make sure the FastAPI server is running (uvicorn app.main:app).';
  }

  return error?.message || fallback;
}
