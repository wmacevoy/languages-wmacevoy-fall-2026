import { defineConfig } from '@playwright/test';

const clients = {
  vanilla: process.env.VANILLA_URL ?? 'http://localhost:3000',
  react: process.env.REACT_URL ?? 'http://localhost:3001',
  vue: process.env.VUE_URL ?? 'http://localhost:3002',
};

export default defineConfig({
  testDir: '.',
  // Every client talks to the same database, so one test runs at a time.
  workers: 1,
  reporter: 'list',
  use: { browserName: 'chromium' },
  projects: Object.entries(clients).map(([name, baseURL]) => ({ name, use: { baseURL } })),
});
