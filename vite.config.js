import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// NVIDIA NIM (integrate.api.nvidia.com) sends no CORS headers, so browser
// requests are proxied. Locally Vite forwards /nvidia-api/* → NIM; in
// production point VITE_NVIDIA_PROXY_URL at your own proxy/edge function.
const NVIDIA_TARGET = 'https://integrate.api.nvidia.com/v1'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure client-side routing works — all requests fallback to index.html
  server: {
    historyApiFallback: true,
    // Sandbox/preview hosts (*.e2b.app and *.vercel.app) must be allowed
    allowedHosts: ['.e2b.app', '.vercel.app', 'localhost'],
    proxy: {
      '/nvidia-api': {
        target: NVIDIA_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nvidia-api/, ''),
      },
    },
  },
  preview: {
    allowedHosts: ['.e2b.app', '.vercel.app', 'localhost'],
    // `vite preview` has no Vercel functions, so map the production relay path
    // back to the /nvidia-api target to keep the deployed URL shape testable.
    proxy: {
      '/api/nvidia': {
        target: NVIDIA_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nvidia(\?action=(chat|models))?$/, (_m, _q, action) => (action === 'chat' ? '/chat/completions' : '/models')),
      },
      '/nvidia-api': {
        target: NVIDIA_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nvidia-api/, ''),
      },
    },
  },
})
