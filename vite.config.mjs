import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
  },
  server: {
    open: true,
  },
  plugins: [
    checker({ typescript: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  }
});
