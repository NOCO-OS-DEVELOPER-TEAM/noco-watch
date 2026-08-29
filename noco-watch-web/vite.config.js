import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' works for GitHub Pages project sites and for /web/ on the PC server
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
  },
  preview: {
    host: true,
    port: 4174,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
