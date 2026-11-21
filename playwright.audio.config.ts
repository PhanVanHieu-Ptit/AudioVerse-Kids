import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// Test-only Vite entry exercises real media without shipping fixture audio or UI.
export default defineConfig({
  ...base,
  testMatch: [
    'audio-engine.spec.ts',
    'audio-controls.spec.ts',
    'voice-recording.spec.ts',
  ],
  testIgnore: [],
  use: { ...base.use, baseURL: 'http://127.0.0.1:4174' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174/e2e/fixtures/audio.html',
    reuseExistingServer: false,
  },
});
