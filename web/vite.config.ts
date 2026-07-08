import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'ctrl_routine',
        short_name: 'ctrl_routine',
        description: 'Painel pessoal de rotina — captura rápida, replanejamento e hábitos',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#2563eb',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        // Firebase Hosting reserves /__/auth/* to complete the OAuth redirect flow
        // (signInWithRedirect). The SPA navigation fallback must not intercept it,
        // or the service worker serves the cached app shell instead of letting the
        // redirect actually complete, and sign-in hangs forever.
        navigateFallbackDenylist: [/^\/__\/auth\//],
      },
    }),
  ],
})
