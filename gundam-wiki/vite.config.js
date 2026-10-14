import { defineConfig } from 'vite';

// La Gundam API no envía cabeceras CORS, así que el navegador bloquea las
// peticiones directas. Vite hace de proxy: /api/... -> https://gundam-api.pages.dev/api/...
const proxy = {
  '/api': {
    target: 'https://gundam-api.pages.dev',
    changeOrigin: true,
  },
};

export default defineConfig({
  server: { proxy },
  preview: { proxy },
});
