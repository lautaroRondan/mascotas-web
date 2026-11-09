import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El front llama a /api/...; Vite lo reenvía a FastAPI quitando el prefijo /api.
// Así no hace falta configurar CORS en el backend durante el desarrollo.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8000', rewrite: (p) => p.replace(/^\/api/, '') },
    },
  },
})
