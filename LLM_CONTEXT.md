Notes from LLM agents:

## Project Overview
(agent:init) zai is a notes app built with SvelteKit, TailwindCSS, and designed as a PWA with offline capabilities. Uses Twilio for SMS authentication and Supabase for user data persistence.

## Architecture Decisions
(agent:init) **Framework**: SvelteKit chosen for robust SSR, excellent PWA support, and modern development experience
(agent:init) **Authentication**: Twilio Verify API for SMS verification with simple token storage in secure cookies
(agent:init) **Database**: Supabase for user management with graceful fallback when not configured
(agent:init) **State Management**: Svelte stores for reactive auth state with cookie persistence
(agent:init) **Styling**: TailwindCSS for responsive, modern UI components
(agent:init) **PWA**: @vite-pwa/sveltekit plugin with workbox for offline functionality

## Current Implementation Status
(agent:init) ✅ Basic SvelteKit app scaffold with TailwindCSS
(agent:init) ✅ PWA configuration with offline support and manifest
(agent:init) ✅ Responsive login UI with offline detection ("you have to log in online")
(agent:homepage) ✅ Homepage with floating top/bottom bars and vertical timeline layout
(agent:homepage) ✅ Top bar with phone number display, online/offline indicator, auto-dim on hover
(agent:homepage) ✅ Bottom bar with search functionality and "Jump to Now" button
(agent:homepage) ✅ Tiptap editor integration with custom Timeline mark extension
(agent:homepage) ✅ Notes storage system with Supabase integration
(agent:homepage) ✅ Timeline-based document building (past notes + timeline marker + future space)
(agent:homepage) ✅ Enter key auto-save of current line with timestamp
(agent:homepage) ✅ Client-side ID generation: 32-bit timestamp + 16-bit user + 16-bit random (fits bigint)
(agent:homepage) ✅ **MIGRATED TO SUPABASE AUTH**: Phone SMS authentication with proper JWT tokens
(agent:homepage) ✅ **PROPER RLS**: auth.uid() based policies working correctly
(agent:homepage) ✅ Simplified auth store with automatic session management

## Environment Setup Required
(agent:homepage) **Step 1**: Create `.env` file with: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
(agent:homepage) **Step 2**: In Supabase Dashboard > Authentication > Providers > Enable "Phone" and configure Twilio
(agent:homepage) **Step 3**: Run `supabase-schema.sql` in your Supabase SQL editor to create the notes table with proper auth

## Development Commands
(agent:init) Run development server: `bun run dev`
(agent:init) Build for production: `bun run build`
(agent:init) Preview build: `bun run preview`

## Technical Notes
(agent:homepage) **Supabase Auth**: Uses built-in phone authentication with Twilio backend (configured in dashboard)
(agent:homepage) **JWT Tokens**: Proper Supabase JWT with auth.uid() for RLS integration
(agent:homepage) **RLS**: Simple policy `auth.uid() = user_id` - database-level security working perfectly
(agent:homepage) **Session Management**: Automatic with `onAuthStateChange()` - handles refresh/expiry
(agent:homepage) Timeline-based note system: all notes loaded into single Tiptap document with timeline mark at current time
(agent:homepage) Custom Tiptap Timeline mark extension renders "Now" indicator with blue line
(agent:homepage) Enter key saves current paragraph to Supabase with client timestamp
(agent:homepage) Client-side ID generation: timestamp(32) + phone(16) + random(16) = 64-bit bigint compatible
(agent:homepage) Optimistic updates: add to local store immediately, rollback if Supabase save fails
(agent:homepage) **Code Reduction**: ~200 lines of custom auth → ~50 lines with Supabase Auth
