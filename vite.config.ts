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
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'mood-meter-app-icon.jpg',
      ],
      // Absolute paths from the bucket origin so iOS Add-to-Home-Screen never
      // opens `/dist/` (S3 HTTPS REST returns AccessDenied for directory URLs).
      // Keep Vite `base: './'` above for relative asset URLs in the built HTML.
      manifest: {
        name: 'Mood Meter',
        short_name: 'Mood Meter',
        description: 'A minimal daily mood journal',
        theme_color: '#0f1419',
        background_color: '#0f1419',
        display: 'standalone',
        start_url: '/dist/index.html',
        scope: '/dist/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      // Do not register Workbox NavigationRoute — standalone launches must not
      // network-fetch `/dist/` and surface S3 AccessDenied XML. Precache stays.
      workbox: {
        // null (not omit) so Object.assign overrides the plugin default "index.html".
        navigateFallback: null,
      },
    }),
  ],
})
