import react from '@vitejs/plugin-react'
// Vite uses this configuration to serve the React client during development
// and bundle the same source for production.
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
