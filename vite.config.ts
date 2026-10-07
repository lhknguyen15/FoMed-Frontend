import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5068'
  // Only local development may use a self-signed certificate; verify cloud HTTPS.
  const localApi = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(apiProxyTarget).hostname)
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: !localApi,
        },
      },
    },
  }
})
