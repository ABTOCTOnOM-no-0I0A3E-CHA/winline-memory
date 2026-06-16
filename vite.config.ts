import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    // Dev proxy: browser hits same-origin /v1, Vite forwards to the backend
    // server-side, so CORS is bypassed entirely (no backend allow-list needed).
    proxy: {
      '/v1': {
        target: 'https://api.165.232.132.230.sslip.io',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    allowedHosts: true,
  },
})
