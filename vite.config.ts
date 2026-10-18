import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Relative base so assets resolve under the S3 `/dist/` object prefix
  // (HTTPS virtual-hosted REST URL, same pattern as wa-critical-infrastructure-map).
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Mood Meter',
        short_name: 'Mood Meter',
        description: 'A minimal daily mood journal',
        theme_color: '#0f1419',
        background_color: '#0f1419',
        display: 'standalone',
        // Must be index.html — S3 REST returns AccessDenied for `/dist/` (no index doc).
        start_url: './index.html',
        scope: './',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
