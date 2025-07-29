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
(agent:hidden-blocks) ✅ **Hidden Blocks System**: TipTap extension that can hide any block type with zero height, no interaction, and proper keyboard navigation skipping
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
(agent:hidden-blocks) **Hidden Blocks Plugin**: TipTap extension using addGlobalAttributes() to add 'hidden' attribute to all block types (paragraph, heading, lists, etc.), ProseMirror decorations for styling, keyboard shortcuts to skip hidden blocks during navigation, click/selection prevention, and deletion protection. Commands: hideBlock(), showBlock(), toggleBlockVisibility(), hideAllBlocks(), showAllBlocks().

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

## Search System
(agent:search) **Redesigned Search Architecture**: Completely redesigned with simpler, more reliable approach - for any query, determines desired visibility state for ALL blocks and sets each block to that state
(agent:search) **Real-time & Case Insensitive**: Search triggers immediately on typing with full case insensitive matching (both query and content converted to lowercase)
(agent:search) **Word Matching**: Space-separated search terms require ALL words to be present in block content (order doesn't matter)
(agent:search) **Bidirectional Processing**: Processes blocks starting from present time working backwards/forwards, prioritizing recent content
(agent:search) **No Flashing**: TipTap's hidden blocks system only changes DOM for blocks that actually need state changes, eliminating visual flashing
(agent:search) **Expanding Query Support**: When deleting characters (making query broader), previously hidden blocks that now match become visible again
(agent:search) **Stream Processing**: Processes blocks in chunks with yield points to avoid blocking UI during large document search
(agent:search) **Clean State Management**: Simple approach eliminates complex state tracking - just determines what each block's visibility should be and sets it
(agent:search) **Extended Block Coverage**: Fixed missing .hidden-block class issue by creating ExtendedOrderedList, ExtendedBlockquote, ExtendedCodeBlock, and ExtendedHorizontalRule extensions - all block types in HiddenBlocksPlugin now have blockId attributes and can be properly hidden during search
(agent:search) **Hierarchical Hiding Logic**: Enhanced hideBlock/showBlock commands to handle parent-child relationships - when hiding a paragraph inside a list item, the list item is also marked as hidden if all its content becomes hidden, ensuring proper CSS styling and visual separators work correctly
(agent:search) **Smart Center Block Tracking**: Enhanced center block selection to avoid hidden elements, with scroll event handling that automatically recomputes the center block when user scrolls during active search, maintaining spatial reference throughout search sessions
(agent:search) **Hierarchical Hiding Bug Fixes**: Fixed critical issue where list items and bullet lists weren't getting hidden-block class - enhanced hierarchical hiding logic to check direct children only (not all descendants) and added proper debugging logs to track parent node hiding behavior
(agent:hidden-dividers) **Enhanced Debugging for Hidden Block Issues**: Added comprehensive logging to HiddenBlocksPlugin hideBlock command showing block content (not just IDs), parent-child relationship analysis, and specific visibility blockers - logs show exactly which visible children prevent parent nodes from being hidden, helping debug why .hidden-block class isn't applied to container elements like ul/li during search
(agent:hidden-dividers) **Critical Transaction State Bug Fix**: Fixed hierarchical hiding logic by tracking blocks hidden in current transaction (hiddenInThisTransaction Set) - the bug was that parent-child analysis checked original document state (child.attrs.hidden) instead of transaction state, so even after marking children as hidden, parent nodes couldn't see the updated state and remained unhidden, preventing .hidden-block CSS class application
(agent:hidden-dividers) **Complete Architecture Simplification**: Removed all permanent hiding complexity and transaction-based hiding system - replaced with clean search state store (searchHiddenBlocks) that manages temporary UI state only. HiddenBlocksPlugin now only handles keyboard navigation and interaction prevention, checking the Svelte store instead of document attributes. Search operations use store functions (hideBlockInSearch/showBlockInSearch/clearSearchHiding) instead of ProseMirror commands. Decorations applied based on store state, eliminating undo/redo pollution and collaboration interference. Added editor reference management to force decoration updates when store changes. Removed all manual hiding debug functionality to focus solely on search-based hiding.

## Next Steps
(agent:contenteditable-basics) Implement awareness for cursor positions and user presence indicators
(agent:contenteditable-basics) Add document sharing and collaborative permissions system
(agent:contenteditable-basics) Optimize debouncing and sync strategies for better performance
(agent:contenteditable-basics) Timeline positioning system in place for advanced time-based navigation features
(agent:timestamp) Build chronological document views and timeline-based navigation using the new block timestamp system
(agent:timestamp) Add block reordering capabilities based on timestamps for temporal document organization
(agent:search) Add search highlighting to visually indicate matching terms within visible blocks
(agent:search) Implement search history and recent searches for improved user experience

## TODO: System Interaction Monitoring
(agent:feat:tags) **Performance Risk - Collaboration**: Tag extraction runs on EVERY editor update including collaborative changes - consider adding collaboration-aware filtering to only process local changes using `!transaction.getMeta('y-sync$')` check
(agent:feat:tags) **Accessibility Risk - Tab Navigation**: KeyboardNavigationPlugin removes tabindex from checkboxes - monitor impact on keyboard users who need to navigate todo lists, may need more granular control
(agent:feat:tags) **Memory Risk - Web Worker Cleanup**: Multiple async systems (tag worker, debounced extraction, collaborative sync) need careful monitoring for memory leaks during heavy collaborative sessions  
(agent:feat:tags) **Keyboard Priority Stack**: Monitor interaction between multiple keyboard handlers (Tags: Enter priority override, Links: Cmd+K, Lists: Tab/Shift+Tab, Tasks: built-in) - should work harmoniously but worth testing edge cases
(agent:feat:tags) **Performance Optimization**: Consider tracking tag processing time for large documents and implementing performance monitoring, especially for documents with hundreds of hashtags
(agent:serialize-marks) **Fixed Serialization Issue**: Tag mentions (hashtag nodes) and links were disappearing when saved to Supabase because MarkdownClipboard serialization didn't handle mention nodes - added proper mention node serialization in processTextContent function and hashtag parsing in MarkdownPaste parseInlineMarkdown function for complete round-trip support
(agent:three-block-sep) **Visual Block Separators**: Added CSS rule to insert horizontal line after 2nd empty paragraph in sequences of 2+ empty paragraphs - targets both mid-document sequences (non-empty + empty + empty) and document-start sequences (first-child empty + empty), uses 3rem padding and scroll-to-now button positions content at 1/3 viewport height, ensures only one line per sequence regardless of length
(agent:pill-login-pin) **UI Refinements**: Updated login flow to use pill design for both phone and OTP steps, replaced "i" in "zai" branding with pin icon for visual consistency, switched all typography from Lora/Interface to Barlow font family, updated indent/outdent icons to clean double chevrons (>> and <<), improved login form usability with consistent pill styling, created custom favicon using pin icon with accent color (#2563eb), implemented dynamic document title "zai - {{first non-empty line}}" that updates based on current section context as user types/moves cursor
(agent:root-only-title) **Title Logic Refinement**: Modified findCurrentSectionFirstLine function to strictly require 2+ empty root-level lines above current section before showing dynamic title - prevents title from appearing in document start or sections without proper separator, ensures only valid sections (separated by double empty lines) contribute to window title
(agent:efficient-title) **Performance & Maintainability Fix**: Exported serializeToMarkdown from MarkdownClipboard.js to eliminate duplicate broken serializer in +page.svelte, rewrote findCurrentSectionFirstLine to be O(log N) by starting from cursor position and working backwards instead of processing all blocks, now uses proper markdown serializer ensuring tags and formatting appear correctly in document titles
(agent:ignore-cursor-empty) **Title Logic Edge Case Fix**: Modified section detection to ignore empty line at cursor position when counting separator lines - if cursor is on empty line, start backwards search from line above it, prevents current typing position from interfering with section boundary detection logic
(agent:zai-logo-pills) **Component Creation & UI Consistency**: Created reusable ZaiLogo.svelte component with invisible "i" and correctly positioned pin icon, supporting sm/md/lg sizes and custom colors. Updated all top chips (version tag, debug, tag processing) to use consistent pill styling with rounded-full borders and proper spacing. Replaced hardcoded zai logos in both main page and login page with the new component for maintainability


broken console snapshot:


+page.svelte:89 🔍 Search query changed: a
+page.svelte:819 🔍 handleSearch called, streamingSearch: true editor: true
+page.svelte:827 🔍 Processing search query: a
+page.svelte:838 🚀 Starting streaming search for: a
streamingSearch.js:306 🔍 StreamingSearch.streamSearch called with query: a
streamingSearch.js:315 🔍 Parsed query words: ['a']
streamingSearch.js:113 🎯 Found center-screen block (avoiding hidden): 7355854112742017921
streamingSearch.js:325 🎯 Set center block for NEW search (was empty): 7355854112742017921
streamingSearch.js:152 🎯 Highlighted center block: 7355854112742017921
streamingSearch.js:206 📜 Started scroll tracking for center block updates
streamingSearch.js:340 📦 Found blocks: 150
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356027135952520576 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 26, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356027135952520576 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356026986274588032 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356026986274588032 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356026907023213952 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356026907023213952 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356026215395067264 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356026215395067264 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356026096876619136 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356026096876619136 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356024106876503424 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356024106876503424 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356024051016762752 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356024051016762752 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356023819877057920 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356023819877057920 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356023727107442048 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356023727107442048 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356022296350655872 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356022296350655872 paragraph
+page.svelte:842 📊 Search progress: {processed: 10, total: 150, matched: 0, query: 'a'}
streamingSearch.js:266 📜 Scrolled to keep block centered: 7355854112742017921
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356022221209699712 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356022221209699712 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356022152112735616 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356022152112735616 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356022115253192064 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356022115253192064 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356022085217781120 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356022085217781120 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356022038690366848 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356022038690366848 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356021259837474176 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356021259837474176 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356020540367537408 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356020540367537408 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356020470435906816 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356020470435906816 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356017647350547712 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356017647350547712 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356015802288801024 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356015802288801024 paragraph
+page.svelte:842 📊 Search progress: {processed: 20, total: 150, matched: 0, query: 'a'}
streamingSearch.js:266 📜 Scrolled to keep block centered: 7355854112742017921
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356015574978495744 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356015574978495744 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356015319356638464 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356015319356638464 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356014678521513216 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356014678521513216 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356013302739469568 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356013302739469568 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356011076612621568 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356011076612621568 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356005580186944641 [paragraph]
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356005580186944641 [paragraph]
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356005580186944641 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 48, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7356005580186944641 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356005580186944641 [paragraph]
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356005580186944641 [paragraph]
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356005580186944641 [paragraph]
streamingSearch.js:381 🙈 Block should be hidden: 7356005580186944641 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356005580186944641 [paragraph]
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356005580186944641 [paragraph]
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7356005580186944641 [paragraph]
streamingSearch.js:381 🙈 Block should be hidden: 7356005580186944641 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355863290244071424 bulletList
streamingSearch.js:377 ✅ Block should be visible: 7355863290244071425 listItem
+page.svelte:842 📊 Search progress: {processed: 30, total: 150, matched: 2, query: 'a'}
streamingSearch.js:266 📜 Scrolled to keep block centered: 7355854112742017921
streamingSearch.js:377 ✅ Block should be visible: 7355863290244071425 listItem
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355863290244071425 smaller text, less padding
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355863290244071425 Button placement
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355863290244071425 Bigger pills
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355863290244071425 Us the .textContent prop rather handrolling serial...
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 58, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355863290244071425 listItem
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 53, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:377 ✅ Block should be visible: 7355863290244071425 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355862981220335616 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355862885976080384 bulletList
streamingSearch.js:377 ✅ Block should be visible: 7355862635957813248 bulletList
streamingSearch.js:377 ✅ Block should be visible: 7355862495129862144 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355862495125667840 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 28, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355862495125667840 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355857148315009024 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355857148315009024 listItem
+page.svelte:842 📊 Search progress: {processed: 40, total: 150, matched: 10, query: 'a'}
streamingSearch.js:266 📜 Scrolled to keep block centered: 7355854112742017921
streamingSearch.js:377 ✅ Block should be visible: 7355857148315009024 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355857148315009024 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355857148315009024 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355855758205222912 bulletList
streamingSearch.js:377 ✅ Block should be visible: 7355854112742017921 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355854112742017921 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355854112742017921 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355854112742017921 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355854112742017921 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355854112742017921 paragraph
+page.svelte:842 📊 Search progress: {processed: 50, total: 150, matched: 20, query: 'a'}
streamingSearch.js:266 📜 Scrolled to keep block centered: 7355854112742017921
streamingSearch.js:377 ✅ Block should be visible: 7355854112742017921 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355854112742017921 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355854112742017921 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355854112742017921 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355854112742017921 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 locked in to shower after. then social translation...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 discussion w snack 
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 got coffee, good. could've locked in faster. plan ...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355855758205222912 bulletList got coffee, good. could've loc...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355855758205222912 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355843013229513601 listItem discussion w snack got coffee,...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 lock in more while actually computing? we were lau...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355855758205222912 bulletList got coffee, good. could've loc...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355855758205222912 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355843013229513601 listItem discussion w snack got coffee,...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 but like, good shit, learned stuff. estimated dist...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355855758205222912 bulletList got coffee, good. could've loc...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355855758205222912 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355843013229513601 listItem discussion w snack got coffee,...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 came back, pretty good. give family time to talk a...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 post shower, having tooo much fun engineering. wha...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Driving takeaways
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 If rushed (time is slipping thru fingers) then ur ...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355862635957813248 bulletList If rushed (time is slipping th...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355862635957813248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355857148315009024 listItem Driving takeawaysIf rushed (ti...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355857148315009024 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 When i was locked in, time felt slow even tho it w...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355862885976080384 bulletList When i was locked in, time fel...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355862885976080384 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355857148315009024 listItem If rushed (time is slipping th...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355857148315009024 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355862635957813248 bulletList If rushed (time is slipping th...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355862635957813248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355857148315009024 listItem Driving takeawaysIf rushed (ti...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355857148315009024 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Start the day with the big rocks. Nicities take a ...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355862635957813248 bulletList If rushed (time is slipping th...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355862635957813248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355857148315009024 listItem Driving takeawaysIf rushed (ti...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355857148315009024 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 [paragraph]
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 [paragraph]
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Zai mobile fixes
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 smaller text, less padding
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355863290244071424 bulletList smaller text, less paddingButt...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=4
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (4) [{…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355863290244071424 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Button placement
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355863290244071424 bulletList smaller text, less paddingButt...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=4
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (4) [{…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355863290244071424 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Bigger pills
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355863290244071424 bulletList smaller text, less paddingButt...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=4
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (4) [{…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355863290244071424 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Us the .textContent prop rather handrolling serial...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355863290244071424 bulletList smaller text, less paddingButt...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=4
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (4) [{…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355863290244071424 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 208, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355854112742017921 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 locked in to shower after. then social translation...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 discussion w snack 
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 got coffee, good. could've locked in faster. plan ...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355855758205222912 bulletList got coffee, good. could've loc...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355855758205222912 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355843013229513601 listItem discussion w snack got coffee,...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 lock in more while actually computing? we were lau...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355855758205222912 bulletList got coffee, good. could've loc...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355855758205222912 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355843013229513601 listItem discussion w snack got coffee,...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 but like, good shit, learned stuff. estimated dist...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355855758205222912 bulletList got coffee, good. could've loc...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355855758205222912 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355843013229513601 listItem discussion w snack got coffee,...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 came back, pretty good. give family time to talk a...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 post shower, having tooo much fun engineering. wha...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Driving takeaways
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 If rushed (time is slipping thru fingers) then ur ...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355862635957813248 bulletList If rushed (time is slipping th...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355862635957813248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355857148315009024 listItem Driving takeawaysIf rushed (ti...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355857148315009024 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 When i was locked in, time felt slow even tho it w...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355862885976080384 bulletList When i was locked in, time fel...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355862885976080384 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355857148315009024 listItem If rushed (time is slipping th...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355857148315009024 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355862635957813248 bulletList If rushed (time is slipping th...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355862635957813248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355857148315009024 listItem Driving takeawaysIf rushed (ti...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355857148315009024 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Start the day with the big rocks. Nicities take a ...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355862635957813248 bulletList If rushed (time is slipping th...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355862635957813248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355857148315009024 listItem Driving takeawaysIf rushed (ti...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355857148315009024 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 [paragraph]
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 [paragraph]
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Zai mobile fixes
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 smaller text, less padding
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355863290244071424 bulletList smaller text, less paddingButt...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=4
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (4) [{…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355863290244071424 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Button placement
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355863290244071424 bulletList smaller text, less paddingButt...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=4
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (4) [{…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355863290244071424 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Bigger pills
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355863290244071424 bulletList smaller text, less paddingButt...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=4
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (4) [{…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355863290244071424 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Us the .textContent prop rather handrolling serial...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355863290244071424 bulletList smaller text, less paddingButt...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=4
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (4) [{…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355863290244071424 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 [paragraph]
streamingSearch.js:381 🙈 Block should be hidden: 7355854112742017921 paragraph
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 188, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:377 ✅ Block should be visible: 7355854112742017921 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355854112742017921 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355854112742017921 paragraph
+page.svelte:842 📊 Search progress: {processed: 60, total: 150, matched: 28, query: 'a'}
streamingSearch.js:266 📜 Scrolled to keep block centered: 7355854112742017921
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 locked in to shower after. then social translation...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 discussion w snack 
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 got coffee, good. could've locked in faster. plan ...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355855758205222912 bulletList got coffee, good. could've loc...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355855758205222912 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355843013229513601 listItem discussion w snack got coffee,...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 lock in more while actually computing? we were lau...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355855758205222912 bulletList got coffee, good. could've loc...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355855758205222912 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355843013229513601 listItem discussion w snack got coffee,...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 but like, good shit, learned stuff. estimated dist...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355855758205222912 bulletList got coffee, good. could've loc...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355855758205222912 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355843013229513601 listItem discussion w snack got coffee,...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 came back, pretty good. give family time to talk a...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 post shower, having tooo much fun engineering. wha...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Driving takeaways
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 If rushed (time is slipping thru fingers) then ur ...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355862635957813248 bulletList If rushed (time is slipping th...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355862635957813248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355857148315009024 listItem Driving takeawaysIf rushed (ti...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355857148315009024 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 When i was locked in, time felt slow even tho it w...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355862885976080384 bulletList When i was locked in, time fel...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355862885976080384 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355857148315009024 listItem If rushed (time is slipping th...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355857148315009024 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355862635957813248 bulletList If rushed (time is slipping th...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355862635957813248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355857148315009024 listItem Driving takeawaysIf rushed (ti...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355857148315009024 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Start the day with the big rocks. Nicities take a ...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355862635957813248 bulletList If rushed (time is slipping th...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355862635957813248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355857148315009024 listItem Driving takeawaysIf rushed (ti...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355857148315009024 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 [paragraph]
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 [paragraph]
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Zai mobile fixes
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 smaller text, less padding
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355863290244071424 bulletList smaller text, less paddingButt...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=4
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (4) [{…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355863290244071424 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Button placement
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355863290244071424 bulletList smaller text, less paddingButt...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=4
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (4) [{…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355863290244071424 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Bigger pills
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355863290244071424 bulletList smaller text, less paddingButt...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=4
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (4) [{…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355863290244071424 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Us the .textContent prop rather handrolling serial...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355863290244071424 bulletList smaller text, less paddingButt...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=4
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (4) [{…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355863290244071424 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 188, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355854112742017921 paragraph
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 188, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:377 ✅ Block should be visible: 7355854112742017921 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 locked in to shower after. then social translation...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 discussion w snack 
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 got coffee, good. could've locked in faster. plan ...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355855758205222912 bulletList got coffee, good. could've loc...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355855758205222912 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355843013229513601 listItem discussion w snack got coffee,...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 lock in more while actually computing? we were lau...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355855758205222912 bulletList got coffee, good. could've loc...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355855758205222912 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355843013229513601 listItem discussion w snack got coffee,...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 but like, good shit, learned stuff. estimated dist...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355855758205222912 bulletList got coffee, good. could've loc...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355855758205222912 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355843013229513601 listItem discussion w snack got coffee,...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 came back, pretty good. give family time to talk a...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 post shower, having tooo much fun engineering. wha...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Driving takeaways
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 If rushed (time is slipping thru fingers) then ur ...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355862635957813248 bulletList If rushed (time is slipping th...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355862635957813248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355857148315009024 listItem Driving takeawaysIf rushed (ti...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355857148315009024 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 When i was locked in, time felt slow even tho it w...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355862885976080384 bulletList When i was locked in, time fel...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355862885976080384 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355857148315009024 listItem If rushed (time is slipping th...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355857148315009024 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355862635957813248 bulletList If rushed (time is slipping th...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355862635957813248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355857148315009024 listItem Driving takeawaysIf rushed (ti...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355857148315009024 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Start the day with the big rocks. Nicities take a ...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355862635957813248 bulletList If rushed (time is slipping th...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355862635957813248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355857148315009024 listItem Driving takeawaysIf rushed (ti...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355857148315009024 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 [paragraph]
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 [paragraph]
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Zai mobile fixes
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 smaller text, less padding
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355863290244071424 bulletList smaller text, less paddingButt...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=4
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (4) [{…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355863290244071424 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Button placement
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355863290244071424 bulletList smaller text, less paddingButt...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=4
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (4) [{…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355863290244071424 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Bigger pills
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355863290244071424 bulletList smaller text, less paddingButt...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=4
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (4) [{…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355863290244071424 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 Us the .textContent prop rather handrolling serial...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355863290244071424 bulletList smaller text, less paddingButt...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=4
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (4) [{…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355863290244071424 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355854112742017921 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 188, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355854112742017921 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355853533256977280 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355851778381155200 bulletList
streamingSearch.js:377 ✅ Block should be visible: 7355847829154532224 bulletList
streamingSearch.js:377 ✅ Block should be visible: 7355843453664988032 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355843453664988032 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355843453664988032 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355843453664988032 morning: wanted to keep sleeping but i was computi...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355843453664988032 did push/ganf because i did cycling yday and wante...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355843453664988032 morning checking, was okay. intentionally overlapp...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355843453664988032 then jumped into engineering! 
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355843453664988032 first ~1.5-2h were small fixes to get up to featur...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355843453664988032 but quickly encountered problems, stepped back rea...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355843453664988032 i think using two editors simultaneously was good?...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355843453664988032 actually, looking at the commits again, maybe not....
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355851778381155200 bulletList actually, looking at the commi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355851778381155200 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355843013229513601 listItem i think using two editors simu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355843453664988032 maybe parallel is good for building out, but not f...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355851778381155200 bulletList actually, looking at the commi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355851778381155200 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355843013229513601 listItem i think using two editors simu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355843453664988032 after lunch, locked the fuck in. (only had 1 hour)...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355847829154532224 bulletList first ~1.5-2h were small fixes...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=9
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355847829154532224 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355843013229513601 listItem then jumped into engineering! ...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513601 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355843013229513600 bulletList morning: wanted to keep sleepi...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=5
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (5) [{…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355843013229513600 bulletList
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 119, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355843453664988032 paragraph
+page.svelte:842 📊 Search progress: {processed: 70, total: 150, matched: 35, query: 'a'}
streamingSearch.js:266 📜 Scrolled to keep block centered: 7355854112742017921
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 119, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:377 ✅ Block should be visible: 7355843453664988032 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355843453664988032 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355843453664988032 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355843453664988032 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355843453664988032 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355843453664988032 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355843013229513600 bulletList
streamingSearch.js:377 ✅ Block should be visible: 7355843013229513601 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355843013229513601 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355843013229513601 listItem
+page.svelte:842 📊 Search progress: {processed: 80, total: 150, matched: 45, query: 'a'}
streamingSearch.js:266 📜 Scrolled to keep block centered: 7355854112742017921
streamingSearch.js:377 ✅ Block should be visible: 7355843013229513601 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355843013229513601 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355843013229513601 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355843013229513601 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355843013229513601 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355843013229513601 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355843013229513601 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355843013229513601 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355843013229513601 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355843013229513601 listItem
+page.svelte:842 📊 Search progress: {processed: 90, total: 150, matched: 55, query: 'a'}
streamingSearch.js:266 📜 Scrolled to keep block centered: 7355854112742017921
streamingSearch.js:377 ✅ Block should be visible: 7355843013229513601 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355843013229513601 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355843013229513601 listItem
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355840292963322752 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 29, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355840292963322752 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355838438191762176 [paragraph]
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355838438191762176 25Hc.XN  
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 39, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355838438191762176 paragraph
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 39, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:377 ✅ Block should be visible: 7355838438191762176 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355629531376747648 notes from youtube 
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 29, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355629531376747648 heading
streamingSearch.js:377 ✅ Block should be visible: 7355629176387634304 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355629176387634305 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355629176387634306 paragraph
+page.svelte:842 📊 Search progress: {processed: 100, total: 150, matched: 62, query: 'a'}
streamingSearch.js:266 📜 Scrolled to keep block centered: 7355854112742017921
streamingSearch.js:377 ✅ Block should be visible: 7355629176387634307 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355629176387634308 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355629176387634309 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355629176387634310 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355629176387634311 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355629176387634312 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355629176387634312 gig economy is exploding. because of low friction ...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355629176383440001 bulletList trying to create a metaverse t...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=8
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (8) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355629176383440001 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355629176387634312 [paragraph]
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355629176387634312 [paragraph]
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 49, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355629176387634312 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355629176387634312 gig economy is exploding. because of low friction ...
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355629176383440001 bulletList trying to create a metaverse t...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=8
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (8) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355629176383440001 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355629176387634312 [paragraph]
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355629176387634312 [paragraph]
streamingSearch.js:381 🙈 Block should be hidden: 7355629176387634312 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355629176383440000 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355629176383440001 bulletList
+page.svelte:842 📊 Search progress: {processed: 110, total: 150, matched: 70, query: 'a'}
streamingSearch.js:266 📜 Scrolled to keep block centered: 7355854112742017921
streamingSearch.js:377 ✅ Block should be visible: 7355629176383440002 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355629176383440003 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355629176383440004 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355629176383440005 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355629176383440006 listItem
streamingSearch.js:377 ✅ Block should be visible: 7355629176383440007 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355629176383440008 listItem
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355438336813926912 or more?
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355437951269308928 taskList and a third level? or more?...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355437951269308928 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355435478894873089 taskItem yeah no these are still brokan...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435495441402368 taskList todo items?yeah no these are s...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435495441402368 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355435478894873089 taskItem for the todo items?yeah no the...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873088 taskList
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 29, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355438336813926912 taskList
streamingSearch.js:377 ✅ Block should be visible: 7355437951269308928 taskList
streamingSearch.js:377 ✅ Block should be visible: 7355435495441402368 taskList
+page.svelte:842 📊 Search progress: {processed: 120, total: 150, matched: 79, query: 'a'}
streamingSearch.js:266 📜 Scrolled to keep block centered: 7355854112742017921
streamingSearch.js:377 ✅ Block should be visible: 7355435478894873088 taskList
streamingSearch.js:377 ✅ Block should be visible: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355438336813926912 at pos: 1010
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 29, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:377 ✅ Block should be visible: 7355435478894873090 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 but maybe not
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873088 taskList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 for the 
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873088 taskList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 todo items?
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435495441402368 taskList todo items?yeah no these are s...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435495441402368 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355435478894873089 taskItem for the todo items?yeah no the...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873088 taskList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 yeah no these are still brok
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435495441402368 taskList todo items?yeah no these are s...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435495441402368 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355435478894873089 taskItem for the todo items?yeah no the...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873088 taskList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 and a third level? 
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355437951269308928 taskList and a third level? or more?...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355437951269308928 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355435478894873089 taskItem yeah no these are still brokan...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435495441402368 taskList todo items?yeah no these are s...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]0: {id: '7355435478894873089', type: 'taskItem', content: 'todo items?'}1: {id: '7355435478894873089', type: 'taskItem', content: 'yeah no these are still brokan...'}2: {id: '7355435478894873089', type: 'taskItem', content: 'damn unf '}length: 3[[Prototype]]: Array(0)
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435495441402368 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355435478894873089 taskItem for the todo items?yeah no the...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873088 taskList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 or more?
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 7: 7355438336813926912 taskList or more?...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355438336813926912 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 6: 7355435478894873089 taskItem and a third level? or more?...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355437951269308928 taskList and a third level? or more?...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355437951269308928 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355435478894873089 taskItem yeah no these are still brokan...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435495441402368 taskList todo items?yeah no these are s...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435495441402368 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355435478894873089 taskItem for the todo items?yeah no the...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873088 taskList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 damn unf 
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435495441402368 taskList todo items?yeah no these are s...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435495441402368 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355435478894873089 taskItem for the todo items?yeah no the...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873088 taskList
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 101, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355435478894873090 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873089 but maybe not
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873089 for the todo items?yeah no these are still brokand...
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 39, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 but maybe not
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
HiddenBlocksPlugin.js:160 🔄 Hiding parent node: 7355435478894873088 taskList at pos: 911
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 for the 
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 todo items?
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435495441402368 taskList todo items?yeah no these are s...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435495441402368 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355435478894873089 taskItem for the todo items?yeah no the...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 yeah no these are still brok
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435495441402368 taskList todo items?yeah no these are s...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435495441402368 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355435478894873089 taskItem for the todo items?yeah no the...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 and a third level? 
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355437951269308928 taskList and a third level? or more?...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355437951269308928 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355435478894873089 taskItem yeah no these are still brokan...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435495441402368 taskList todo items?yeah no these are s...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435495441402368 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355435478894873089 taskItem for the todo items?yeah no the...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 or more?
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 7: 7355438336813926912 taskList or more?...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355438336813926912 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 6: 7355435478894873089 taskItem and a third level? or more?...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355437951269308928 taskList and a third level? or more?...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355437951269308928 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355435478894873089 taskItem yeah no these are still brokan...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435495441402368 taskList todo items?yeah no these are s...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435495441402368 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355435478894873089 taskItem for the todo items?yeah no the...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 damn unf 
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435495441402368 taskList todo items?yeah no these are s...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435495441402368 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355435478894873089 taskItem for the todo items?yeah no the...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 29, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355435478894873090 paragraph
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 39, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:377 ✅ Block should be visible: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355435478894873088 at pos: 911
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355435478894873088 at pos: 911
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355435478894873088 at pos: 911
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355435478894873088 at pos: 911
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355435478894873088 at pos: 911
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355435478894873088 at pos: 911
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355435478894873088 at pos: 911
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 99, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:377 ✅ Block should be visible: 7355435478894873090 paragraph
streamingSearch.js:377 ✅ Block should be visible: 7355435478894873089 taskItem
+page.svelte:842 📊 Search progress: {processed: 130, total: 150, matched: 86, query: 'a'}
streamingSearch.js:266 📜 Scrolled to keep block centered: 7355854112742017921
streamingSearch.js:377 ✅ Block should be visible: 7355435478894873090 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873089 but maybe not
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873089 for the todo items?yeah no these are still brokand...
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 39, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 but maybe not
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
HiddenBlocksPlugin.js:160 🔄 Hiding parent node: 7355435478894873088 taskList at pos: 911
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 for the 
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 todo items?
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435495441402368 taskList todo items?yeah no these are s...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435495441402368 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355435478894873089 taskItem for the todo items?yeah no the...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 yeah no these are still brok
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435495441402368 taskList todo items?yeah no these are s...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435495441402368 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355435478894873089 taskItem for the todo items?yeah no the...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 and a third level? 
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355437951269308928 taskList and a third level? or more?...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355437951269308928 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355435478894873089 taskItem yeah no these are still brokan...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435495441402368 taskList todo items?yeah no these are s...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435495441402368 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355435478894873089 taskItem for the todo items?yeah no the...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 or more?
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 7: 7355438336813926912 taskList or more?...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355438336813926912 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 6: 7355435478894873089 taskItem and a third level? or more?...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 5: 7355437951269308928 taskList and a third level? or more?...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355437951269308928 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 4: 7355435478894873089 taskItem yeah no these are still brokan...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435495441402368 taskList todo items?yeah no these are s...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435495441402368 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355435478894873089 taskItem for the todo items?yeah no the...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435478894873090 damn unf 
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435495441402368 taskList todo items?yeah no these are s...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=3
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (3) [{…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435495441402368 taskList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355435478894873089 taskItem for the todo items?yeah no the...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355435478894873088 taskList but maybe notfor the todo item...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 99, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355435478894873090 paragraph
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 39, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:377 ✅ Block should be visible: 7355435478894873089 taskItem
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355435478894873088 at pos: 911
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355435478894873088 at pos: 911
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355435478894873088 at pos: 911
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355435478894873088 at pos: 911
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355435478894873088 at pos: 911
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355435478894873088 at pos: 911
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355435478894873088 at pos: 911
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 99, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:377 ✅ Block should be visible: 7355435478894873090 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355435438692469248 looks like it doesfor the bullets
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=4
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (4) [{…}, {…}, {…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 29, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355435438692469248 bulletList
streamingSearch.js:377 ✅ Block should be visible: 7355434914559658496 bulletList
streamingSearch.js:377 ✅ Block should be visible: 7355434914559658497 listItem
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434914559658497 let's create some lists
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434914559658497 with multiple items
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434914559658497 and some nesting
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434914559658497 does this shit work?looks like it doesfor the bull...
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 68, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355434914559658497 listItem
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 59, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:377 ✅ Block should be visible: 7355434914559658497 listItem
+page.svelte:842 📊 Search progress: {processed: 140, total: 150, matched: 92, query: 'a'}
streamingSearch.js:266 📜 Scrolled to keep block centered: 7355854112742017921
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434914559658497 let's create some lists
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434914559658497 with multiple items
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434914559658497 and some nesting
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434914559658497 does this shit work?looks like it doesfor the bull...
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 59, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355434914559658497 listItem
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434914559658497 let's create some lists
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434914559658497 with multiple items
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434914559658497 and some nesting
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434914559658497 does this shit work?looks like it doesfor the bull...
streamingSearch.js:381 🙈 Block should be hidden: 7355434914559658497 listItem
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434914559658497 let's create some lists
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434914559658497 with multiple items
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434914559658497 and some nesting
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434914559658497 does this shit work?looks like it doesfor the bull...
streamingSearch.js:381 🙈 Block should be hidden: 7355434914559658497 listItem
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 perfect
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 let's create some lists
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
HiddenBlocksPlugin.js:160 🔄 Hiding parent node: 7355434914559658496 bulletList at pos: 772
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 with multiple items
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 and some nesting
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 does this shit work?
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 looks like it does
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435438692469248 bulletList looks like it doesfor the bull...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435438692469248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355434914559658497 listItem does this shit work?looks like...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 for the bullets
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435438692469248 bulletList looks like it doesfor the bull...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435438692469248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355434914559658497 listItem does this shit work?looks like...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=true, visibleCount=0
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 114, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355434894435387904 paragraph
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355434914559658496 at pos: 772
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355434914559658496 at pos: 772
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355434914559658496 at pos: 772
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355434914559658496 at pos: 772
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355435438692469248 at pos: 866
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355434914559658497 at pos: 843
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355434914559658496 at pos: 772
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355435438692469248 at pos: 866
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355434914559658497 at pos: 843
HiddenBlocksPlugin.js:196 🔄 Showing parent node: 7355434914559658496 at pos: 772
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 122, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:377 ✅ Block should be visible: 7355434894435387904 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 perfect
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 let's create some lists
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 with multiple items
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 and some nesting
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 does this shit work?
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 looks like it does
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435438692469248 bulletList looks like it doesfor the bull...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435438692469248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355434914559658497 listItem does this shit work?looks like...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658497 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 for the bullets
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435438692469248 bulletList looks like it doesfor the bull...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435438692469248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355434914559658497 listItem does this shit work?looks like...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658497 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 98, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355434894435387904 paragraph
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 89, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:377 ✅ Block should be visible: 7355434894435387904 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 perfect
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 let's create some lists
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 with multiple items
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 and some nesting
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 does this shit work?
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 looks like it does
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435438692469248 bulletList looks like it doesfor the bull...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435438692469248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355434914559658497 listItem does this shit work?looks like...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658497 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 for the bullets
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435438692469248 bulletList looks like it doesfor the bull...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435438692469248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355434914559658497 listItem does this shit work?looks like...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658497 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
SupabaseProvider.js:201 ⚡ Y.js update detected: {updateLength: 89, origin: 'LOCAL', willSave: true}
SupabaseProvider.js:218 ⚡ Scheduling save in 1 second...
streamingSearch.js:381 🙈 Block should be hidden: 7355434894435387904 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 perfect
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 let's create some lists
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 with multiple items
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 and some nesting
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 does this shit work?
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 looks like it does
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435438692469248 bulletList looks like it doesfor the bull...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435438692469248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355434914559658497 listItem does this shit work?looks like...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658497 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 for the bullets
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435438692469248 bulletList looks like it doesfor the bull...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435438692469248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355434914559658497 listItem does this shit work?looks like...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658497 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
streamingSearch.js:381 🙈 Block should be hidden: 7355434894435387904 paragraph
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 perfect
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 let's create some lists
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 with multiple items
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 and some nesting
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 does this shit work?
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 looks like it does
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435438692469248 bulletList looks like it doesfor the bull...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435438692469248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355434914559658497 listItem does this shit work?looks like...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658497 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
HiddenBlocksPlugin.js:111 🙈 Hiding block: 7355434894435387904 for the bullets
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 3: 7355435438692469248 bulletList looks like it doesfor the bull...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=2
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: (2) [{…}, {…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355435438692469248 bulletList
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 2: 7355434914559658497 listItem does this shit work?looks like...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658497 listItem
HiddenBlocksPlugin.js:125 🔍 Checking parent at depth 1: 7355434914559658496 bulletList let's create some listswith mu...
HiddenBlocksPlugin.js:153    📊 Children analysis: hasChildren=true, allHidden=false, visibleCount=1
HiddenBlocksPlugin.js:155    👁️ Visible children preventing hiding: [{…}]
HiddenBlocksPlugin.js:164 🚫 NOT hiding parent - has visible children: 7355434914559658496 bulletList
streamingSearch.js:381 🙈 Block should be hidden: 7355434894435387904 paragraph
+page.svelte:842 📊 Search progress: {processed: 150, total: 150, matched: 94, query: 'a'}
streamingSearch.js:266 📜 Scrolled to keep block centered: 7355854112742017921
+page.svelte:842 📊 Search progress: {processed: 150, total: 150, matched: 94, query: 'a', completed: true}
streamingSearch.js:417 ✅ Search completed - matched: 94 total: 150
+page.svelte:846 ✅ Search completed
streamingSearch.js:113 🎯 Found center-screen block (avoiding hidden): 7355863290244071425
streamingSearch.js:191 📜 Scroll detected - updating center block: 7355854112742017921 -> 7355863290244071425
streamingSearch.js:152 🎯 Highlighted center block: 7355863290244071425
SupabaseProvider.js:172 💾 Saving document to Supabase: {user: 'df5b08e2-1147-4ac5-a4a1-6e3e39dfa958', document: 'timeline-notes', stateLength: 426735}
SupabaseProvider.js:82 📥 SupabaseProvider: Raw data received: {type: 'string', isArray: false, isUint8Array: false, length: 9926710, firstBytes: '\\x7b2230223a3230342c2231223a362c2232223a322c223322'}
SupabaseProvider.js:102 📥 Attempting to decode string: \x7b2230223a3230342c2231223a362c2232223a322c223322...
SupabaseProvider.js:106 📥 Detected hex-encoded string, converting...
SupabaseProvider.js:115 📥 Decoded hex to JSON: {"0":204,"1":6,"2":2,"3":204,"4":161,"5":229,"6":252,"7":15,"8":0,"9":1,"10":1,"11":7,"12":100,"13":...
SupabaseProvider.js:120 📥 Converted to array, length: 408657
SupabaseProvider.js:149 📥 Applying Y.js update, length: 408657 first bytes: (10) [204, 6, 2, 204, 161, 229, 252, 15, 0, 1]
SupabaseProvider.js:230 🔔 Setting up realtime subscription for user: df5b08e2-1147-4ac5-a4a1-6e3e39dfa958 document: timeline-notes
SupabaseProvider.js:255 🔔 Realtime channel created: _RealtimeChannel {topic: 'realtime:document:timeline-notes:df5b08e2-1147-4ac5-a4a1-6e3e39dfa958', params: {…}, socket: RealtimeClient, bindings: {…}, state: 'joining', …}
SupabaseProvider.js:37 SupabaseProvider: Document synced
SupabaseProvider.js:249 🔔 Realtime subscription status: SUBSCRIBED
