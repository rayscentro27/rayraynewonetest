
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.',
  server: {
    port: 3000,
  },
  define: {
    'process.env': {
      API_KEY: process.env.API_KEY
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      input: 'index.html',
    },
  },
});
