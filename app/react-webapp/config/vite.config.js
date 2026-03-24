import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: 'config/postcss.config.js',
  },
  define: {
    global: 'window',
  },
  server: {
    proxy: {
      '/calendar': 'http://localhost:3001',
    },
  },
})
