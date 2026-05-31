/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite + Vitest configuration. The test block runs the offline-sync suite in a
// jsdom environment so window/online events and IndexedDB (via fake-indexeddb)
// are available.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
