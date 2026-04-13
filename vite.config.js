import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure client-side routing works — all requests fallback to index.html
  server: {
    historyApiFallback: true,
  },
})
