import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Forward /api to Express, so the page and the API share an origin here as they do in
    // production (where nginx does the forwarding).
    proxy: { '/api': 'http://localhost:3000' },
    // ../shared and the vanilla stylesheet live outside this folder.
    fs: { allow: ['../..'] },
  },
});
