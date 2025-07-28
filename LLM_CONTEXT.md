Notes from LLM agents:

## Project Overview
(agent:contenteditable-basics) zai is a simplified timeline-based notes app built with SvelteKit and TipTap editor. Uses localStorage for persistence and focuses on a clean, distraction-free writing experience with timeline navigation.

## Architecture Decisions
(agent:contenteditable-basics) **Framework**: SvelteKit chosen for modern development experience and excellent integration with TipTap
(agent:contenteditable-basics) **Editor**: TipTap with StarterKit, TaskList, TaskItem extensions for rich text editing
(agent:contenteditable-basics) **Storage**: localStorage for simple client-side persistence (preparing for y.js collaboration)
(agent:contenteditable-basics) **State Management**: Simple local state with auto-save to localStorage
(agent:contenteditable-basics) **Styling**: TailwindCSS for clean, minimal UI

## Current Implementation Status
(agent:contenteditable-basics) ✅ Basic SvelteKit app with simplified structure (removed auth/backend complexity)
(agent:contenteditable-basics) ✅ TipTap editor with bullet lists, todo lists, and timeline functionality
(agent:contenteditable-basics) ✅ Custom Timeline mark extension for "Now" indicators
(agent:contenteditable-basics) ✅ Auto-save to localStorage on content changes
(agent:contenteditable-basics) ✅ Timeline navigation with "Jump to Now" button that scrolls timeline marker to center
(agent:contenteditable-basics) ✅ Basic search functionality within editor content
(agent:contenteditable-basics) ✅ Clean toolbar with easy access to bullet lists, todo lists, and timeline insertion
(agent:contenteditable-basics) ✅ Responsive bottom bar with search and timeline navigation

## Features
(agent:contenteditable-basics) **Timeline-based writing**: Insert timeline markers to organize content by time
(agent:contenteditable-basics) **Jump to Now**: Quick navigation to scroll timeline marker to center of screen
(agent:contenteditable-basics) **Rich formatting**: Bullet lists, numbered lists, and interactive todo lists
(agent:contenteditable-basics) **Auto-save**: Content automatically saved to localStorage on changes
(agent:contenteditable-basics) **Search**: Basic text search within editor content

## Development Commands
(agent:contenteditable-basics) Install dependencies: `bun install`
(agent:contenteditable-basics) Run development server: `bun run dev`
(agent:contenteditable-basics) Build for production: `bun run build`

## Technical Notes
(agent:contenteditable-basics) **Editor Extensions**: StarterKit (no history), TaskList/TaskItem (todos), Collaboration, Placeholder, custom TimelineMark
(agent:contenteditable-basics) **Timeline Implementation**: Custom mark extension that renders "Now" indicator with blue line styling
(agent:contenteditable-basics) **Y.js CRDT Backend**: Real-time collaborative document state with conflict resolution
(agent:contenteditable-basics) **IndexedDB Persistence**: Local offline storage with automatic Y.Doc sync via y-indexeddb
(agent:contenteditable-basics) **Timeline Navigation**: Finds timeline marks in document and scrolls them to viewport center
(agent:contenteditable-basics) **Document State**: Y.Doc + IndexedDB manages all content, zero localStorage dependency

## Current Y.js Integration
(agent:contenteditable-basics) ✅ **Y.js CRDT collaboration**: Integrated @tiptap/extension-collaboration with yjs for real-time editing
(agent:contenteditable-basics) ✅ **Conflict-free document state**: Y.Doc manages all document state instead of localStorage  
(agent:contenteditable-basics) ✅ **Collaborative history**: Disabled StarterKit history in favor of Y.js collaborative undo/redo
(agent:contenteditable-basics) ✅ **Smart initial content**: Content loaded once per document using Y.js config map
(agent:contenteditable-basics) ✅ **IndexedDB persistence**: Offline storage with y-indexeddb for local data persistence
(agent:contenteditable-basics) ✅ **Proper cleanup**: Y.js document and IndexedDB provider destroyed on component unmount

## Next Steps
(agent:contenteditable-basics) Add WebSocket provider (y-websocket) for multi-user real-time synchronization
(agent:contenteditable-basics) Implement awareness for cursor positions and user presence
(agent:contenteditable-basics) Timeline positioning system in place for advanced time-based navigation features
