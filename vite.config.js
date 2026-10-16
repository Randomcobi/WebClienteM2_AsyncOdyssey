import { defineConfig } from 'vite';

// Proxy para evitar el error de CORS de la API
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
