import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base '/' : los assets se cargan desde la raíz, necesario para los links cortos /r/<id>
export default defineConfig({
  plugins: [react()],
  base: '/',
})
