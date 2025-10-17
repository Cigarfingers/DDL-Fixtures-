import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/DDL-Fixtures-/',   // ← must match the repo name exactly
})
