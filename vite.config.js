import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/informasijp/',
  server: {
    https: false,
    host: true,
    hmr: {
      protocol: 'wss',
      host: 'bp2jkjatim.web.id/informasijp',
    }
  }
})


