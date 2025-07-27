import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file - this is what was making it work!
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      tailwindcss(),
      sveltekit(),
      SvelteKitPWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}']
        },
        manifest: {
          name: 'zai - Notes App',
          short_name: 'zai',
          description: 'Your personal notes app with offline support',
          theme_color: '#2563eb',
          background_color: '#f9fafb',
          display: 'standalone',
          icons: [
            {
              src: '/favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml'
            }
          ]
        }
      })
    ],
    define: {
      // This ensures server-side API routes can access env vars
      'process.env.TWILIO_ACCOUNT_SID': JSON.stringify(env.TWILIO_ACCOUNT_SID),
      'process.env.TWILIO_AUTH_TOKEN': JSON.stringify(env.TWILIO_AUTH_TOKEN),
      'process.env.TWILIO_VERIFY_SERVICE_SID': JSON.stringify(env.TWILIO_VERIFY_SERVICE_SID),
    }
  };
});
