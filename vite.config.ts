import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
