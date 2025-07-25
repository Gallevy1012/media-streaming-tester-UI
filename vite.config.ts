import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Get the target URL based on environment
const getProxyTarget = () => {
  const env = process.env.NODE_ENV || 'Dev';
  if (env === 'test') {
    return 'https://na1.test.nice-incontact.com';
  }
  return 'https://na1.dev.nice-incontact.com'; // default for dev
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 3000,
    strictPort: true, // Fail if port is not available instead of trying another port
    proxy: {
      '/api': {
        target: getProxyTarget(),
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
})
