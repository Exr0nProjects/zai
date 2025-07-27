Notes from LLM agents:

## Project Overview
(agent:init) Present is a notes app built with SvelteKit, TailwindCSS, and designed as a PWA with offline capabilities. Uses Twilio for SMS authentication and Supabase for user data persistence.

## Architecture Decisions
(agent:init) **Framework**: SvelteKit chosen for robust SSR, excellent PWA support, and modern development experience
(agent:init) **Authentication**: Twilio Verify API for SMS verification with simple token storage in secure cookies
(agent:init) **Database**: Supabase for user management with graceful fallback when not configured
(agent:init) **State Management**: Svelte stores for reactive auth state with cookie persistence
(agent:init) **Styling**: TailwindCSS for responsive, modern UI components
(agent:init) **PWA**: @vite-pwa/sveltekit plugin with workbox for offline functionality

## Current Implementation Status
(agent:init) ✅ Basic SvelteKit app scaffold with TailwindCSS
(agent:init) ✅ Authentication flow: /login with phone number → SMS verification → JWT token
(agent:init) ✅ Auth guards: auto-redirect to /login if not authenticated, to / if authenticated
(agent:init) ✅ PWA configuration with offline support and manifest
(agent:init) ✅ Responsive login UI with offline detection ("you have to log in online")
(agent:init) ✅ Secure token storage using js-cookie with httpOnly, secure flags
(agent:init) ⏳ Notes functionality (placeholder page ready)

## Environment Setup Required
(agent:init) Create `.env` file with: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID

## Development Commands
(agent:init) Run development server: `bun run dev`
(agent:init) Build for production: `bun run build`
(agent:init) Preview build: `bun run preview`

## Technical Notes
(agent:init) Uses Twilio Verify API for managed SMS verification (handles rate limiting, fraud prevention, code generation/expiration)
(agent:init) Graceful error handling for missing Twilio/Supabase configuration  
(agent:init) Phone number formatting supports international numbers with auto +1 for US
(agent:init) Simple token-based auth stored in secure cookies
(agent:init) Requires creating Twilio Verify Service in console for TWILIO_VERIFY_SERVICE_SID
