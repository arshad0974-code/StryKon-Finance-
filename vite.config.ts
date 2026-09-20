import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: process.env.VITE_BASE_PATH || './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      allowedHosts: true as const,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
    },
  };
});
