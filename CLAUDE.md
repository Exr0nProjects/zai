# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

First some ground rules. Whenever you write code, you MUST:
- WRITE PRODUCTION CODE. DO NOT use fallbacks/simulations/placeholders. In the error paths (eg. invalid credentials, etc) just print helpful error messages so we can WORK TOGETHER TO FIX IT. 
- If there are architectural choices to be made, use the following prioritization:
    - ROBUSTNESS ON TOP. use common-path code and well-known, mature, loved-by-devs libraries. minimize small/one-off/undermaintained dependencies. 
    - SIMPLICITY NEXT. Keep interfaces simple, avoid drilling arguments, and keep code concise. DO NOT CHANGE THE INTERFACES OR MAKE LARGE CHANGES TO THE CODE without confirming with me first. If you find you are doing something complex or bending over backwards to make something work, STOP and we can work together to fix it. 
    - AVOID: hand-rolling boilerplate, using quirks of libraries (which results in brittle code), etc. 
- USE BEST PRACTICES, SEARCH THE INTERNET FOR EXAMPLES IF NEEDED. KEEP IT ROBUST AND SIMPLE. 
- Use bun for JS package management, and never try to run the code (do not run bun dev, swift, etc) unless explicitly told to do so—just print out the instructions to run. 
- Add a fixed, non-interactive top-right floating three-word version tag in dev mode—updating on every chat message. Make it specific for each chat message and change it in every chat response, so that I can be sure I'm seeing the updated version. 
- Always check the LLM_CONTEXT.md file for information on the project, and update it with motivations/decisions/architectural changes and other context that a future chat would need to pick up where we left off (eg. the command to run the project, or which files are not done yet). Note any changes/fixes that we needed to make (due to package usage, function ordering requirements, race conditions, architectural problems) that were not obvious from the getgo. Keep this file concise (add < 300 words). You should sign every line you update in this file with (agent:<taskname>) at the beginning of the line (immediately after the indentation and bullet point if in a list, but before the text content), where I will give you your taskname for that chat session. don't add new sections/bolds unless necessary, and do not call the updates "new" or "changes", because this is a living document, there will be many more changes in the future. This is not a changelog, it is documentation.


## Development Commands

**Package Manager**: Uses `bun` as the package manager
- `bun install` - Install dependencies
- `bun run dev` - Start development server with Vite
- `bun run build` - Build for production (static output)
- `bun run preview` - Preview production build
- `bun run deploy` - Build and deploy to Cloudflare Pages via Wrangler

## Architecture Overview

**zai** is a collaborative timeline-based notes application built as a SvelteKit SPA with real-time collaboration features. The architecture centers around:

- **Frontend**: SvelteKit 2.x with Svelte 5, TailwindCSS 4.x, deployed as static SPA
- **Editor**: TipTap 3.x with extensive custom extensions for collaborative editing
- **Real-time Collaboration**: Y.js CRDT with custom Supabase provider for serverless collaboration
- **Authentication**: Supabase Auth with SMS/phone verification
- **Database**: Supabase PostgreSQL with RLS policies
- **Offline Storage**: IndexedDB via y-indexeddb for offline persistence
- **PWA**: Full Progressive Web App with service worker and caching strategies
- **Deployment**: Cloudflare Pages with SPA fallback

## Core Technical Stack

### Editor System
The application heavily extends TipTap with custom node extensions that add unique capabilities:

- **Extended Nodes**: All block types (Paragraph, BulletList, TaskList, etc.) are extended with `blockId`, `createdAt`, and `parentId` attributes
- **Snowflake IDs**: 64-bit unique identifiers with timestamp, user ID, hour, and sequence components
- **Block Timestamps**: Every block has creation timestamps enabling chronological document organization
- **Hidden Blocks**: Plugin allows hiding any block type with proper keyboard navigation
- **Tag System**: Hashtag mentions with web worker-based extraction and real-time suggestions
- **Link Support**: Full hyperlink functionality with contextual bubble menu
- **Timeline Markers**: Custom "Now" indicators for time-based organization

### Collaboration Architecture
- **Y.js CRDT**: Conflict-free collaborative editing with custom Supabase provider
- **Real-time Sync**: Supabase Realtime for live collaboration notifications
- **Offline-First**: IndexedDB persistence with automatic cloud sync when online
- **User Isolation**: RLS policies ensure users only access their own documents
- **Markdown Serialization**: Custom clipboard handling for copy/paste with proper mention and link preservation

### Key Custom Extensions
Located in `src/lib/tiptap/`:
- `ExtendedParagraph.js` - Paragraph nodes with timestamp attributes
- `ExtendedBulletList.js` - Bullet lists with block metadata
- `ExtendedTaskList.js` - Todo lists with timestamps
- `TagMention.js` - Hashtag system with TipTap mention extension
- `HiddenBlocksPlugin.js` - Block visibility control
- `TimestampPlugin.js` - Block creation timestamp management
- `BlockInfoDecorator.js` - Debug decorations showing block metadata
- `MarkdownClipboard.js` - Custom serialization for copy/paste

## Environment Setup

### Required Environment Variables
Create `.env` file with:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Configuration
1. Run `supabase-schema.sql` in Supabase SQL editor to create the documents table
2. Enable Supabase Realtime for the documents table
3. Configure Supabase Auth → Phone provider with Twilio for SMS verification
4. Ensure RLS policies are properly configured for user document isolation

## Development Patterns

### TipTap Extension Development
- All block-level nodes extend base TipTap nodes with custom attributes
- Use `addGlobalAttributes()` for features that apply to multiple node types
- Keyboard shortcuts use TipTap's priority system - extend with `addKeyboardShortcuts()` for proper precedence
- ProseMirror decorations for visual enhancements that don't affect document structure

### Collaboration Best Practices
- Check `!transaction.getMeta('y-sync$')` to distinguish local vs collaborative changes
- Use debouncing for expensive operations triggered by editor updates
- Properly cleanup Y.js providers and documents on component unmount

### Block System
- Snowflake ID generation via `initializeSnowflakeGenerator()` for unique block identification
- Block sorting utilities in `src/lib/utils/blockSorting.js` for chronological organization
- Parent-child relationships maintained during block splitting operations

## State Management

- **Auth**: Svelte stores in `src/lib/stores/auth.js` with Supabase session management
- **Tags**: Reactive stores in `src/lib/utils/tagManager.js` with web worker extraction
- **Editor State**: Y.js document state with IndexedDB and Supabase sync
- **Collaboration**: Y.js awareness for user presence (foundation in place for cursor indicators)

## Deployment

**Target Platform**: Cloudflare Pages as SPA
- Static adapter configured in `svelte.config.js`
- SPA fallback to `index.html` for client-side routing
- Wrangler configuration in `wrangler.toml`
- PWA service worker with Workbox caching strategies

The application is designed to be 100% serverless, relying on Supabase for all backend functionality and Cloudflare Pages for global distribution.

## Notable Implementation Details

- **Font**: Uses Barlow font family throughout the application
- **Title Logic**: Dynamic document titles based on current section (requires 2+ empty lines as separator)
- **Keyboard Navigation**: Custom plugin handles tab navigation while preserving accessibility
- **Performance**: Web worker for tag extraction to avoid blocking main thread
- **Visual Design**: Pill-style UI components with consistent styling patterns
- **Debug Features**: Block visualization tools for development with CSS variable toggles