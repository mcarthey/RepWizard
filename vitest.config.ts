import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
      '@assets': resolve(__dirname, './attached_assets'),
      '@components': resolve(__dirname, './client/src/components'),
      '@hooks': resolve(__dirname, './client/src/hooks'),
      '@lib': resolve(__dirname, './client/src/lib'),
      '@pages': resolve(__dirname, './client/src/pages'),
      '@shared': resolve(__dirname, './shared'),
    },
  },
});