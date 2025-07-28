# zai

A collaborative timeline-based notes app built with SvelteKit, TipTap editor, and Y.js CRDT. Features real-time collaboration, offline persistence, and clean typography.

## Features

- **100% Serverless**: No servers to maintain, scales automatically with Supabase
- **Real-time Collaboration**: Multiple users can edit simultaneously with Y.js CRDT
- **Timeline Navigation**: "Jump to Now" button to navigate timeline markers
- **Rich Text Editing**: Bullet lists, todo lists, and timeline markers
- **Offline Support**: IndexedDB persistence with automatic cloud sync
- **Authentication**: Secure SMS/phone verification via Supabase
- **Beautiful Typography**: Lora font with optimized reading experience

## Setup

1. Install dependencies:
```bash
bun install
```

2. Set up environment variables (create `.env` file):
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Configure Supabase:
   - Enable Phone authentication in Supabase Dashboard
   - Configure Twilio for SMS verification
   - Run `supabase-schema.sql` in your Supabase SQL editor
   - Enable Realtime for the documents table

## Developing

Start the development server:
```bash
bun run dev
```

That's it! The app is now fully serverless. Open multiple browser tabs with different users to test collaborative editing!

## Building

To create a production version:
```bash
bun run build
```

Preview the build:
```bash
bun run preview
```
