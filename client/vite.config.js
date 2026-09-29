import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const API_TARGET = process.env.API_URL || 'http://localhost:3000';

// Proxying keeps the browser on one origin, so no CORS handling is needed here.
// `preview` does not inherit this from `server`, so both declare it.
const proxy = {
  '/api': { target: API_TARGET, changeOrigin: true },
};

export default defineConfig({
  plugins: [vue()],
  // The country list lives in ../shared so the API and the form use the same codes.
  server: { port: 5173, proxy, fs: { allow: ['.', '../shared'] } },
  preview: { port: 4173, proxy },
});
