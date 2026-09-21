import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' keeps the build deployable on any static host (GitHub Pages, Netlify, etc.)
export default defineConfig({
  plugins: [react()],
  base: './',
})
