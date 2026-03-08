import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // proxy /api requests to backend during development
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        timeout: 0, // No timeout
        proxyTimeout: 0, // No proxy timeout
        // Keep the exact /api health route, but remove the /api prefix for other routes
        // so backend routes like /forgot can remain without the /api prefix.
        rewrite: (path) => {
          if (path === '/api') return '/api';
          // Don't rewrite backup routes - keep them as-is
          if (path.startsWith('/api/backup')) return path;
          return path.replace(/^\/api/, '');
        },
      },
    },
  },
})