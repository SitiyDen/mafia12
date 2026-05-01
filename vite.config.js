import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/mafia-api': {
        target: 'https://app-128839102.1cmycloud.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/mafia-api/, '/applications/mafia/api'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.cookie) {
              proxyReq.setHeader('Cookie', req.headers.cookie)
            }
            proxyReq.removeHeader('origin')
            proxyReq.removeHeader('referer')
          })
        },
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
