import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Required for GitHub Pages project site: https://imkharn.github.io/Lituus-UI-mockup/
  base: '/Lituus-UI-mockup/',
  plugins: [react(), tailwindcss()],
})
