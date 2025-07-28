import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    allowedHosts: [
      '4327ee33a22d.ngrok-free.app'
    ]
  },
  plugins: [
    tailwindcss(),
    sveltekit(),
          SvelteKitPWA({
        strategies: 'generateSW',
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                }
              }
            },
            {
              urlPattern: /.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                }
              }
            },
            {
              urlPattern: ({ url }) => url.hostname.includes('supabase'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api',
                networkTimeoutSeconds: 3,
                plugins: [
                  {
                    cacheWillUpdate: async ({ response }) => {
                      return response.status === 200 ? response : null;
                    }
                  }
                ]
              }
            }
          ]
        },
        kit: {
          trailingSlash: 'ignore'
        },
        manifest: false, // Use static manifest.json file instead
        devOptions: {
          enabled: false, // Disable in dev for static builds
          suppressWarnings: true
        },
        injectRegister: 'inline'
      })
  ]
});
