import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // The dev server proxies /api/* to the FastAPI backend so the frontend code
  // can use same-origin relative URLs (no hardcoded backend host).
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true, // listen on 0.0.0.0 — reachable from containers/previews
      allowedHosts: true,
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
