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
(agent:simplify-saving) **Simplified Saving**: Each paragraph = one database note with data-note-id attribute
(agent:simplify-saving) Document comparison detects changes: compare current vs previous document state
(agent:simplify-saving) Auto-save with 1-second debounce: only saves paragraphs that actually changed
(agent:simplify-saving) Timeline gutter shows timestamps via CSS data-timestamp attributes
(agent:simplify-saving) New content detection: paragraphs without note IDs become new notes
(agent:save-while-typing) **Real-time Conflict Prevention**: Tracks currently editing note ID to prevent Supabase real-time updates from clobbering typed content
(agent:save-while-typing) Document builder preserves current editor content for paragraphs being typed in, using database content for others
(agent:save-while-typing) Real-time subscriptions filter out updates to currently editing paragraphs to prevent race conditions
(agent:homepage) Timeline-based note system: all notes loaded into single Tiptap document with timeline mark at current time
(agent:homepage) Custom Tiptap Timeline mark extension renders "Now" indicator with blue line
(agent:homepage) Client-side ID generation: timestamp(32) + phone(16) + random(16) = 64-bit bigint compatible
(agent:homepage) Optimistic updates: add to local store immediately, rollback if Supabase save fails
(agent:homepage) **Code Reduction**: ~200 lines of custom auth → ~50 lines with Supabase Auth
(agent:simplify-saving) **Code Simplification**: Removed complex transaction tracking, node modification detection, and cursor management (~400 lines → ~150 lines)
