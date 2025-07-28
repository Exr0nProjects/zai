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
(agent:contenteditable-basics) **Editor**: Simple contenteditable implementation replacing TipTap for better performance and simplicity

## Current Implementation Status
(agent:init) ✅ Basic SvelteKit app scaffold with TailwindCSS
(agent:init) ✅ PWA configuration with offline support and manifest
(agent:init) ✅ Responsive login UI with offline detection ("you have to log in online")
(agent:homepage) ✅ Homepage with floating top/bottom bars and vertical timeline layout
(agent:homepage) ✅ Top bar with phone number display, online/offline indicator, auto-dim on hover
(agent:homepage) ✅ Bottom bar with search functionality and "Jump to Now" button
(agent:contenteditable-basics) ✅ Contenteditable timeline interface with timestamp gutter
(agent:contenteditable-basics) ✅ Click-to-edit blocks with visual editing states and keyboard shortcuts
(agent:contenteditable-basics) ✅ Timeline-based layout: past notes → "Now" marker → new block → future notes
(agent:contenteditable-basics) ✅ Enter key saves current block, Escape cancels editing
(agent:homepage) ✅ Notes storage system with Supabase integration
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
(agent:contenteditable-basics) Install dependencies after TipTap removal: `bun install`

## Technical Notes
(agent:homepage) **Supabase Auth**: Uses built-in phone authentication with Twilio backend (configured in dashboard)
(agent:homepage) **JWT Tokens**: Proper Supabase JWT with auth.uid() for RLS integration
(agent:homepage) **RLS**: Simple policy `auth.uid() = user_id` - database-level security working perfectly
(agent:homepage) **Session Management**: Automatic with `onAuthStateChange()` - handles refresh/expiry
(agent:contenteditable-basics) **Contenteditable Interface**: Direct DOM manipulation with event handlers for click-to-edit, blur-to-save
(agent:contenteditable-basics) **Timeline Layout**: Timestamp gutter (120px) + content area with visual distinction for past/future notes
(agent:contenteditable-basics) **Keyboard Shortcuts**: Enter saves and exits editing, Escape cancels and restores original content
(agent:contenteditable-basics) **"Now" Concept**: Blue timeline marker with scrolling functionality, new blocks created at current time
(agent:contenteditable-basics) **Simplified Notes Store**: Removed TipTap document building, now uses getSortedNotesWithNowPosition()
(agent:homepage) Enter key saves current paragraph to Supabase with client timestamp
(agent:homepage) Client-side ID generation: timestamp(32) + phone(16) + random(16) = 64-bit bigint compatible
(agent:homepage) Optimistic updates: add to local store immediately, rollback if Supabase save fails
(agent:homepage) **Code Reduction**: ~200 lines of custom auth → ~50 lines with Supabase Auth
(agent:contenteditable-basics) **TipTap Removal**: Eliminated complex editor dependencies for lighter bundle and simpler maintenance
