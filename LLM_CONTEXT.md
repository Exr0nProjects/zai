Notes from LLM agents:

## Project Overview
(agent:contenteditable-basics) zai is a collaborative timeline-based notes app built with SvelteKit, TipTap editor, and Y.js CRDT. Features Supabase authentication, real-time collaboration, and offline persistence with a clean, distraction-free writing experience.

## Architecture Decisions
(agent:contenteditable-basics) **Framework**: SvelteKit chosen for modern development experience and excellent integration with TipTap
(agent:contenteditable-basics) **Editor**: TipTap with StarterKit, TaskList, TaskItem, Collaboration extensions for rich collaborative editing
(agent:contenteditable-basics) **Authentication**: Supabase Auth with SMS/phone verification for secure user access
(agent:contenteditable-basics) **Real-time Collaboration**: Y.js CRDT with custom Supabase provider for serverless conflict-free editing
(agent:contenteditable-basics) **Storage**: IndexedDB (y-indexeddb) for offline persistence + Supabase database for cloud sync
(agent:contenteditable-basics) **Serverless Architecture**: 100% serverless using Supabase database + Realtime for collaboration
(agent:contenteditable-basics) **State Management**: Y.js document state with Svelte auth stores
(agent:contenteditable-basics) **Styling**: TailwindCSS for clean, minimal UI with Lora font for elegant typography

## Current Implementation Status
(agent:contenteditable-basics) ✅ Basic SvelteKit app with simplified structure (removed auth/backend complexity)
(agent:contenteditable-basics) ✅ TipTap editor with bullet lists, todo lists, and timeline functionality
(agent:contenteditable-basics) ✅ Custom Timeline mark extension for "Now" indicators
(agent:contenteditable-basics) ✅ Auto-save to localStorage on content changes
(agent:contenteditable-basics) ✅ Timeline navigation with "Jump to Now" button that scrolls timeline marker to center
(agent:contenteditable-basics) ✅ Basic search functionality within editor content
(agent:contenteditable-basics) ✅ Clean toolbar with easy access to bullet lists, todo lists, and timeline insertion
(agent:contenteditable-basics) ✅ Responsive bottom bar with search and timeline navigation
(agent:timestamp) ✅ **Block-level Timestamps**: Extended Paragraph, BulletList, TaskList, ListItem, TaskItem nodes with blockId, createdAt, parentId attributes
(agent:timestamp) ✅ **Snowflake ID Generator**: 64-bit unique IDs with timestamp, user, hour, and sequence components for reliable block identification
(agent:timestamp) ✅ **Split Behavior**: When nodes are split (Enter key), new blocks get fresh IDs and timestamps with parent tracking
(agent:timestamp) ✅ **Block Sorting Utilities**: Functions to extract, sort, and analyze timestamped blocks for timeline-based organization
(agent:timestamp) ✅ **Debug Interface**: Block debug panel showing stats, hierarchy, and time ranges for development
(agent:timestamp) ✅ **Block Decorations**: Hover tooltips in left gutter showing block IDs, timestamps, and parent relationships  
(agent:timestamp) ✅ **Visual Controls**: CSS variables for toggling debug borders and block borders independently
(agent:feat:links) ✅ **Link Support**: Full link mark implementation with TipTap Link extension for clickable hyperlinks
(agent:feat:links) ✅ **Link Bubble Menu**: Contextual menu that appears when cursor is inside a link with edit, remove, and open actions
(agent:feat:links) ✅ **Link Dialog**: Modal interface for adding and editing links with URL input, keyboard shortcuts (Enter/Escape)
(agent:feat:links) ✅ **Smart Link Behavior**: Handles both selected text linking and standalone URL insertion, click selection enabled
(agent:feat:tags) ✅ **Tag System**: TipTap mention extension configured for hashtags with # trigger, web worker for tag extraction, and real-time tag suggestions
(agent:feat:tags) ✅ **Tag Keyboard Navigation**: Fixed Enter key priority issue where default newline handler was intercepting tag selection - used TipTap's extend() method with addKeyboardShortcuts() to override priority, working with the ecosystem rather than against it

## Features
(agent:contenteditable-basics) **Timeline-based writing**: Insert timeline markers to organize content by time
(agent:contenteditable-basics) **Jump to Now**: Quick navigation to scroll timeline marker to center of screen
(agent:contenteditable-basics) **Rich formatting**: Bullet lists, numbered lists, and interactive todo lists
(agent:contenteditable-basics) **Auto-save**: Content automatically saved to localStorage on changes
(agent:contenteditable-basics) **Search**: Basic text search within editor content
(agent:timestamp) **Block Timestamps**: Every paragraph, list item, and list has unique IDs, creation timestamps, and parent relationships
(agent:timestamp) **Timestamp Sorting**: Blocks can be sorted chronologically with debug tools for viewing block hierarchy
(agent:feat:links) **Hyperlink Support**: Create and edit links with accent color styling, hover underlines, and right-click editing
(agent:feat:links) **Link Navigation**: Click to open links, cursor navigation with arrow keys, contextual bubble menu for editing
(agent:feat:tags) **Tag Mentions**: Type # to trigger tag suggestions, web worker automatically extracts and indexes hashtags from document content, visual loading indicator during processing

## Development Commands
(agent:contenteditable-basics) Install dependencies: `bun install`
(agent:contenteditable-basics) Run development server: `bun run dev`
(agent:contenteditable-basics) Build for production: `bun run build`

## Environment Setup Required
(agent:contenteditable-basics) **Step 1**: Create `.env` file with: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
(agent:contenteditable-basics) **Step 2**: In Supabase Dashboard > Authentication > Providers > Enable "Phone" and configure Twilio
(agent:contenteditable-basics) **Step 3**: Run `supabase-schema.sql` in your Supabase SQL editor to create the documents table
(agent:contenteditable-basics) **Step 4**: Enable Realtime for the documents table in Supabase Dashboard

## Technical Notes
(agent:contenteditable-basics) **Editor Extensions**: StarterKit (no history), TaskList/TaskItem (todos), Collaboration, Placeholder, custom TimelineMark
(agent:contenteditable-basics) **Timeline Implementation**: Custom mark extension that renders "Now" indicator with blue line styling
(agent:contenteditable-basics) **Y.js CRDT Backend**: Real-time collaborative document state with conflict resolution
(agent:contenteditable-basics) **Custom Supabase Provider**: Y.js provider that syncs with Supabase database + Realtime for serverless collaboration
(agent:contenteditable-basics) **IndexedDB Persistence**: Local offline storage with automatic Y.Doc sync via y-indexeddb
(agent:contenteditable-basics) **Timeline Navigation**: Finds timeline marks in document and scrolls them to viewport center
(agent:contenteditable-basics) **Document State**: Y.Doc + IndexedDB + Supabase database manages all content, fully serverless
(agent:timestamp) **Extended Node Architecture**: Custom TipTap extensions that extend base nodes (Paragraph, BulletList, etc.) with blockId, createdAt, parentId attributes
(agent:timestamp) **Snowflake IDs**: 64-bit IDs with 42-bit timestamp, 10-bit user ID, 5-bit hour, 7-bit sequence for collision-free identification
(agent:timestamp) **Block Splitting Logic**: Custom Enter key handlers that preserve parent-child relationships when splitting nodes
(agent:timestamp) **Block Sorting System**: Utilities for extracting, sorting, and analyzing blocks by creation timestamp for timeline views
(agent:feat:links) **Link Extension**: TipTap Link extension with openOnClick disabled, click selection enabled, accent color styling
(agent:feat:links) **BubbleMenu Integration**: Contextual floating menu using @tiptap/extension-bubble-menu that appears when cursor is in link
(agent:feat:links) **Link State Management**: Modal dialog with proper keyboard handling, URL validation, and state cleanup
(agent:feat:links) **Smart Link Detection**: Automatic protocol handling, link updating vs creation based on selection and context
(agent:feat:tags) **Tag System Architecture**: Web worker-based tag extraction using regex pattern `/(?:^|\s)#([^\s#]+)/g`, TipTap mention extension with tippy.js suggestions, debounced content processing (2s delay), reactive Svelte stores for tag state management
(agent:feat:tags) **Tag Navigation Priority Fix**: Critical lesson learned about TipTap keyboard priority - default Enter handler (newline creation) has higher priority than suggestion system. Fixed by extending Mention extension with addKeyboardShortcuts() that detects active suggestion state and returns false to let TipTap's suggestion utility handle Enter selection. Tab works as Enter alias, Ctrl+N/P for vim navigation, all arrow keys handled by TipTap natively.

## Current Serverless Integration
(agent:contenteditable-basics) ✅ **Supabase Authentication**: SMS/phone verification with secure JWT tokens and session management
(agent:contenteditable-basics) ✅ **Auth-protected Routes**: Login page with automatic navigation guards and user state management
(agent:contenteditable-basics) ✅ **Y.js CRDT collaboration**: Integrated @tiptap/extension-collaboration with yjs for real-time editing
(agent:contenteditable-basics) ✅ **Conflict-free document state**: Y.Doc manages all document state with IndexedDB + Supabase sync
(agent:contenteditable-basics) ✅ **Collaborative history**: Disabled StarterKit history in favor of Y.js collaborative undo/redo
(agent:contenteditable-basics) ✅ **Smart initial content**: Content loaded once per document using Y.js config map
(agent:contenteditable-basics) ✅ **IndexedDB persistence**: Offline storage with y-indexeddb for local data persistence
(agent:contenteditable-basics) ✅ **Serverless real-time sync**: Custom SupabaseProvider using database + Realtime for collaboration
(agent:contenteditable-basics) ✅ **User-specific documents**: RLS policies ensure users only access their own documents
(agent:contenteditable-basics) ✅ **100% Serverless Architecture**: No servers to maintain, scales automatically with Supabase
(agent:contenteditable-basics) ✅ **Proper cleanup**: All providers and Y.js document destroyed on component unmount

## PWA Implementation
(agent:contenteditable-basics) ✅ **Progressive Web App**: Full PWA setup with @vite-pwa/sveltekit for offline capability and installability
(agent:contenteditable-basics) ✅ **Service Worker**: Custom Workbox-based service worker with intelligent caching strategies
(agent:contenteditable-basics) ✅ **Web App Manifest**: Complete manifest.json with app metadata, icons, and installation settings
(agent:contenteditable-basics) ✅ **Offline Support**: Network-first strategy for API calls, cache-first for static assets, works fully offline with IndexedDB
(agent:contenteditable-basics) ✅ **Auto-Updates**: Service worker update notifications with user-friendly update banner
(agent:contenteditable-basics) ✅ **Font Caching**: Smart caching of Google Fonts for offline typography
(agent:contenteditable-basics) ✅ **Mobile-Optimized**: Apple PWA meta tags and mobile-specific configurations

## Next Steps
(agent:contenteditable-basics) Implement awareness for cursor positions and user presence indicators
(agent:contenteditable-basics) Add document sharing and collaborative permissions system
(agent:contenteditable-basics) Optimize debouncing and sync strategies for better performance
(agent:contenteditable-basics) Timeline positioning system in place for advanced time-based navigation features
(agent:timestamp) Build chronological document views and timeline-based navigation using the new block timestamp system
(agent:timestamp) Add block reordering capabilities based on timestamps for temporal document organization

## TODO: System Interaction Monitoring
(agent:feat:tags) **Performance Risk - Collaboration**: Tag extraction runs on EVERY editor update including collaborative changes - consider adding collaboration-aware filtering to only process local changes using `!transaction.getMeta('y-sync$')` check
(agent:feat:tags) **Accessibility Risk - Tab Navigation**: KeyboardNavigationPlugin removes tabindex from checkboxes - monitor impact on keyboard users who need to navigate todo lists, may need more granular control
(agent:feat:tags) **Memory Risk - Web Worker Cleanup**: Multiple async systems (tag worker, debounced extraction, collaborative sync) need careful monitoring for memory leaks during heavy collaborative sessions  
(agent:feat:tags) **Keyboard Priority Stack**: Monitor interaction between multiple keyboard handlers (Tags: Enter priority override, Links: Cmd+K, Lists: Tab/Shift+Tab, Tasks: built-in) - should work harmoniously but worth testing edge cases
(agent:feat:tags) **Performance Optimization**: Consider tracking tag processing time for large documents and implementing performance monitoring, especially for documents with hundreds of hashtags
(agent:serialize-marks) **Fixed Serialization Issue**: Tag mentions (hashtag nodes) and links were disappearing when saved to Supabase because MarkdownClipboard serialization didn't handle mention nodes - added proper mention node serialization in processTextContent function and hashtag parsing in MarkdownPaste parseInlineMarkdown function for complete round-trip support
