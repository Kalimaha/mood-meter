import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/** Absolute under the S3 /dist/ prefix (bucket origin). Cache-busted filenames. */
const ICON_192 = '/dist/pwa-192-v3.png'
const ICON_512 = '/dist/pwa-512-v3.png'

export default defineConfig({
  // Relative base so assets resolve under the S3 `/dist/` object prefix
  // (HTTPS virtual-hosted REST URL, same pattern as wa-critical-infrastructure-map).
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Unregister any previously installed SW so deploys are not masked by cache.
      // Manifest + icons still ship for Add to Home Screen.
      selfDestroying: true,
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon-v3.png',
        'pwa-192-v3.png',
        'pwa-512-v3.png',
        'mood-meter-app-icon.jpg',
      ],
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
            src: ICON_192,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: ICON_512,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: ICON_512,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
