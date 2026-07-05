import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/mal-search': {
        target: 'https://myanimelist.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mal-search/, ''),
      },
    },
  },
});
