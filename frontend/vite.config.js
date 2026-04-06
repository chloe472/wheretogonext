import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  /** Must match backend listen port ([backend/src/index.js] PORT || 5000). */
  const apiProxyTarget = (env.VITE_API_PROXY_TARGET || 'http://localhost:5000').replace(/\/$/, '');

  return {
    plugins: [react()],
    server: {
      port: 3000,
      // Don't set COOP here: Google OAuth popup needs to check window.closed; strict COOP blocks that and causes "Sign-in failed" + console errors.
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          /** Long-lived SSE (/api/notifications/stream): avoid proxy idle timeouts where supported. */
          timeout: 0,
          proxyTimeout: 0,
          configure(proxy) {
            proxy.on('error', (err, req, res) => {
              const code = err?.code || '';
              const hint =
                code === 'ECONNREFUSED'
                  ? ' (is the API running? e.g. npm run server or npm run dev from repo root)'
                  : '';
              console.error(
                `[vite proxy] ${code || err?.message || err}${hint}`,
                req?.url ? `→ ${req.url}` : '',
              );
              if (res && !res.headersSent && typeof res.writeHead === 'function') {
                try {
                  res.writeHead(502, { 'Content-Type': 'text/plain' });
                  res.end('Bad gateway: API unreachable');
                } catch {
                  /* ignore */
                }
              }
            });
          },
        },
      },
    },
  };
});
