/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

function spa404Plugin() {
  return {
    name: 'spa-404-fallback',
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist');
      const indexHtml = path.join(dist, 'index.html');
      const fallback404 = path.join(dist, '404.html');
      if (fs.existsSync(indexHtml)) {
        fs.copyFileSync(indexHtml, fallback404);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), spa404Plugin()],
  base: '/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});

