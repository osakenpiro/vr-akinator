import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  base: '/vr-akinator/',
  build: { outDir: 'docs', emptyOutDir: true }
})
