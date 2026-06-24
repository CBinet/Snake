import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Snake/',
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
