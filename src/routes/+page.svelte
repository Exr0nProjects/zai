<script>
  import { onMount, onDestroy } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Placeholder from '@tiptap/extension-placeholder';
  import { user, authActions } from '$lib/stores/auth.js';
  import { checkOnlineStatus } from '$lib/utils/auth.js';
  import { notes, notesActions, isLoading } from '$lib/stores/notes.js';
  import { TimelineMark } from '$lib/tiptap/TimelineMark.js';
  
  let isOnline = true;
  let topBarHovered = false;
  let searchQuery = '';
  let editor;
  let element;
  
  onMount(async () => {
    // Check online status
    isOnline = await checkOnlineStatus();
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => isOnline = true);
      window.addEventListener('offline', () => isOnline = false);
    }

    // Load notes from Supabase
    await notesActions.loadNotes();
    
    // Initialize Tiptap editor
    editor = new Editor({
      element: element,
      extensions: [
        StarterKit,
        TimelineMark,
        Placeholder.configure({
          placeholder: 'Start writing your thoughts...',
        }),
      ],
      content: notesActions.buildTimelineDocument($notes),
      onUpdate: ({ editor }) => {
        // Auto-save functionality could go here
      },
      editorProps: {
        handleKeyDown: (view, event) => {
          // Handle Enter key to save current line
          if (event.key === 'Enter' && !event.shiftKey) {
            const { selection } = view.state;
            const currentPos = selection.from;
            
            // Get current line content
            const doc = view.state.doc;
            const currentNode = doc.nodeAt(currentPos);
            const resolvedPos = doc.resolve(currentPos);
            const currentParagraph = resolvedPos.parent;
            
            if (currentParagraph && currentParagraph.textContent.trim()) {
              // Save the current line
              notesActions.saveNote(currentParagraph.textContent, new Date());
            }
            
            return false; // Allow normal Enter behavior
          }
          return false;
        }
      }
    });

    // Watch for notes changes and update editor
    const unsubscribe = notes.subscribe((currentNotes) => {
      if (editor && !$isLoading) {
        const newContent = notesActions.buildTimelineDocument(currentNotes);
        const currentContent = editor.getJSON();
        
        // Only update if content actually changed to avoid cursor jumps
        if (JSON.stringify(newContent) !== JSON.stringify(currentContent)) {
          editor.commands.setContent(newContent);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });
  
  function handleSearch() {
    if (searchQuery.trim()) {
      // TODO: Implement search within editor content
      console.log('Searching for:', searchQuery);
    }
  }
  
  function focusAtTimeline() {
    if (editor) {
      // Find the timeline mark and position cursor there
      const { doc } = editor.state;
      let timelinePos = null;
      
      doc.descendants((node, pos) => {
        if (node.marks.some(mark => mark.type.name === 'timeline')) {
          timelinePos = pos;
          return false; // Stop searching
        }
      });
      
      if (timelinePos !== null) {
        editor.commands.focus();
        editor.commands.setTextSelection(timelinePos);
      } else {
        // If no timeline found, focus at end
        editor.commands.focus('end');
      }
    }
  }
  
  function logout() {
    authActions.logout();
  }
</script>

<!-- Top Bar -->
<div 
  class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 transition-opacity duration-300 {topBarHovered ? 'opacity-100' : 'opacity-10'}"
  on:mouseenter={() => topBarHovered = true}
  on:mouseleave={() => topBarHovered = false}
>
  <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
    <!-- Phone Number -->
    <div class="flex items-center space-x-3">
      <div class="text-sm font-medium text-gray-900">
        {$user?.phone || 'Loading...'}
      </div>
      <button 
        on:click={logout}
        class="text-xs text-gray-500 hover:text-red-600 transition-colors"
      >
        Sign Out
      </button>
    </div>
    
    <!-- Online/Offline Indicator -->
    <div class="flex items-center space-x-2">
      <div class="w-2 h-2 rounded-full {isOnline ? 'bg-green-500' : 'bg-red-500'}"></div>
      <span class="text-sm text-gray-600">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  </div>
</div>

<!-- Main Editor Area -->
<div class="pt-16 pb-20 min-h-screen bg-white">
  <div class="max-w-4xl mx-auto px-4 py-8">
    {#if $isLoading}
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">Loading your notes...</span>
      </div>
    {:else}
      <!-- Tiptap Editor -->
      <div 
        bind:this={element}
        class="prose prose-lg max-w-none focus-within:outline-none min-h-[60vh] px-4 py-8"
      />
    {/if}
  </div>
</div>

<!-- Bottom Bar -->
<div class="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-gray-200">
  <div class="max-w-4xl mx-auto px-4 py-3 flex items-center space-x-4">
    <!-- Search Box -->
    <div class="flex-1 max-w-md relative">
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search notes..."
        class="w-full bg-gray-100 rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        on:keypress={(e) => e.key === 'Enter' && handleSearch()}
      />
      <button
        on:click={handleSearch}
        class="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-blue-600 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </button>
    </div>
    
    <!-- Focus Timeline Button -->
    <button
      on:click={focusAtTimeline}
      class="w-1/3 bg-blue-600 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span>Jump to Now</span>
    </button>
  </div>
</div>

<style>
  :global(.ProseMirror) {
    outline: none;
    padding: 1rem;
    line-height: 1.8;
  }
  
  :global(.ProseMirror p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
  }
  
  :global(.timeline-marker) {
    position: relative;
    display: block;
    width: 100%;
    margin: 1rem 0;
    border-top: 2px solid #3b82f6;
  }
  
  :global(.timeline-marker::before) {
    content: 'Now';
    position: absolute;
    top: -1rem;
    left: 0;
    background: #3b82f6;
    color: white;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    transform: translateY(50%);
  }
</style>
