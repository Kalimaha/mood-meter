import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  // Relative base so assets resolve under the S3 `/dist/` object prefix
  // (HTTPS virtual-hosted REST URL, same pattern as wa-critical-infrastructure-map).
  base: './',
  build: {
    outDir: 'dist',
  },
  plugins: [react(), tailwindcss()],
})
