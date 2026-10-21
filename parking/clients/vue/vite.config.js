import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
    // Forward /api to Express, so the page and the API share an origin here as they do in
    // production (where nginx does the forwarding).
    proxy: { '/api': 'http://localhost:3000' },
    // ../shared and the vanilla stylesheet live outside this folder.
    fs: { allow: ['../..'] },
  },
});
