import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    legacy({
      targets: ['chrome >= 60', 'safari >= 11', 'edge >= 18', 'firefox >= 60', 'not IE 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderModernChunks: true,
    }),
  ],
  build: {
    target: ['es2015', 'chrome60', 'safari11', 'edge18'],
    cssTarget: ['chrome60', 'safari11'],
  },
});
