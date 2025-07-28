<script>
  import { onMount, onDestroy } from 'svelte';
  import { Editor } from '@tiptap/core';
  import Document from '@tiptap/extension-document';
  import Text from '@tiptap/extension-text';
  import Heading from '@tiptap/extension-heading';
  import Bold from '@tiptap/extension-bold';
  import Italic from '@tiptap/extension-italic';
  import Code from '@tiptap/extension-code';
  import Strike from '@tiptap/extension-strike';
  import Blockquote from '@tiptap/extension-blockquote';
  import HorizontalRule from '@tiptap/extension-horizontal-rule';
  import OrderedList from '@tiptap/extension-ordered-list';
  import CodeBlock from '@tiptap/extension-code-block';
  import HardBreak from '@tiptap/extension-hard-break';
  import Dropcursor from '@tiptap/extension-dropcursor';
  import Gapcursor from '@tiptap/extension-gapcursor';
  import Placeholder from '@tiptap/extension-placeholder';
  import Collaboration from '@tiptap/extension-collaboration';
  import * as Y from 'yjs';
  import { IndexeddbPersistence } from 'y-indexeddb';
  import { SupabaseProvider } from '$lib/providers/SupabaseProvider.js';
  import { user, authActions } from '$lib/stores/auth.js';
  import { TimelineMark } from '$lib/tiptap/TimelineMark.js';
  import { ExtendedParagraph } from '$lib/tiptap/ExtendedParagraph.js';
  import { ExtendedBulletList } from '$lib/tiptap/ExtendedBulletList.js';
  import { ExtendedTaskList } from '$lib/tiptap/ExtendedTaskList.js';
  import { ExtendedListItem } from '$lib/tiptap/ExtendedListItem.js';
  import { ExtendedTaskItem } from '$lib/tiptap/ExtendedTaskItem.js';
  import { BlockInfoDecorator } from '$lib/tiptap/BlockInfoDecorator.js';
  import ListKeymap from '@tiptap/extension-list-keymap';
  import { initializeSnowflakeGenerator } from '$lib/utils/snowflake.js';
  import { getAllBlocks, sortBlocksByTimestamp, getBlockStats } from '$lib/utils/blockSorting.js';
  
  // Online/offline detection
  let isOnline = true;
  
  let searchQuery = '';
  let editor;
  let element;
  
  // Simple timeline management
  let timelinePosition = null;
  
  // Block management
  let blockStats = { total: 0, byType: {}, withParents: 0, orphaned: 0, timeRange: null };
  let showBlockDebug = false;
  
  // Y.js document for collaboration
  const ydoc = new Y.Doc();
  let indexeddbProvider;
  let supabaseProvider;
  
  onMount(() => {
    // Initialize snowflake generator with user ID (if available)
    const userId = $user?.id ? parseInt($user.id.slice(-8), 16) : 0;
    initializeSnowflakeGenerator(userId);
    
    // Check online status
    isOnline = navigator.onLine;
    
    // Listen for online/offline events
    window.addEventListener('online', () => isOnline = true);
    window.addEventListener('offline', () => isOnline = false);
    
    // Initialize Tiptap editor with basic extensions
    editor = new Editor({
      element: element,
      extensions: [
        // TaskList first to handle `- [ ]` before BulletList handles `- `
        ExtendedTaskList,
        ExtendedTaskItem.configure({
          nested: true,
        }),
        
        // BulletList AFTER TaskList so TaskList gets priority for `- [ ]`
        ExtendedBulletList,
        
        // Essential TipTap extensions (no History to avoid Y.js conflicts)
        Document,
        ExtendedParagraph,
        Text,
        HardBreak,
        
        // Typography
        Heading.configure({
          levels: [1, 2, 3, 4, 5, 6],
        }),
        Bold,
        Italic,
        Strike,
        Code,
        CodeBlock,
        Blockquote,
        HorizontalRule,
        
        // Lists
        OrderedList,
        ExtendedListItem,
        ListKeymap, // Provides Tab/Shift+Tab behavior for nested lists
        
        // UI
        Dropcursor,
        Gapcursor,
        
        // Y.js Collaboration extension (replaces History)
        Collaboration.configure({
          document: ydoc,
        }),
        
        TimelineMark,
        BlockInfoDecorator,
        Placeholder.configure({
          placeholder: 'What do you think?',
        }),
      ],
      // No initial content - Y.js will manage document state
    });

    // Initialize IndexedDB persistence for offline storage
    indexeddbProvider = new IndexeddbPersistence('timeline-notes', ydoc);
    
    // Initialize Supabase provider for serverless real-time collaboration
    const documentName = 'timeline-notes'; // Simple document name per user
    
    // Initialize Supabase provider when user is available
    if ($user) {
      supabaseProvider = new SupabaseProvider(documentName, ydoc, $user);
    }
    
    // Set initial content only once when Y.js document is synced
    indexeddbProvider.whenSynced.then(() => {
      if (ydoc.getMap('config').get('initialContentLoaded') !== true && editor) {
        ydoc.getMap('config').set('initialContentLoaded', true);
        editor.commands.setContent(getInitialContent());
        
        // Initialize block IDs for existing content after a short delay
        setTimeout(() => {
          initializeExistingBlocks();
        }, 100);
      }
    });
    
    // Update block stats periodically
    if (editor) {
      const updateStats = () => {
        const blocks = getAllBlocks(editor);
        blockStats = getBlockStats(blocks);
      };
      
      // Update stats on editor changes
      editor.on('update', updateStats);
      
      // Update stats every 10 seconds
      const statsInterval = setInterval(updateStats, 10000);
      
      return () => {
        clearInterval(statsInterval);
      };
    }

    // Set initial timeline position
    updateTimelinePosition();
    
    // Update timeline position every minute
    const timelineInterval = setInterval(updateTimelinePosition, 60000);
    
    return () => {
      clearInterval(timelineInterval);
    };
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
    // Clean up Supabase provider
    if (supabaseProvider) {
      supabaseProvider.destroy();
    }
    // Clean up IndexedDB provider
    if (indexeddbProvider) {
      indexeddbProvider.destroy();
    }
    // Clean up Y.js document
    ydoc.destroy();
  });
  
  function initializeExistingBlocks() {
    if (!editor) return;
    
    // Add IDs and timestamps to any existing blocks that don't have them
    editor.state.doc.descendants((node, pos) => {
      if (['paragraph', 'listItem', 'taskItem', 'bulletList', 'taskList'].includes(node.type.name)) {
        if (!node.attrs.blockId) {
          const blockId = generateBlockId();
          const timestamp = getCurrentTimestamp();
          
          editor.chain()
            .focus(pos)
            .updateAttributes(node.type.name, {
              blockId,
              createdAt: timestamp,
              parentId: null,
            })
            .run();
        }
      }
    });
  }

  function sortBlocksByTimestampAction(ascending = true) {
    if (!editor) return;
    
    const blocks = getAllBlocks(editor);
    const sortedBlocks = sortBlocksByTimestamp(blocks, ascending);
    
    console.log('📊 Block sorting:', {
      total: blocks.length,
      direction: ascending ? 'ascending' : 'descending',
      blocks: sortedBlocks.map(b => ({
        id: b.blockId,
        type: b.nodeType,
        created: new Date(b.createdAt).toLocaleString(),
        content: b.content.slice(0, 50),
      }))
    });
  }

  function toggleBlockDebug() {
    showBlockDebug = !showBlockDebug;
    if (showBlockDebug) {
      const blocks = getAllBlocks(editor);
      blockStats = getBlockStats(blocks);
    }
  }

  function getInitialContent() {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Welcome to your timeline notes! Add content above and below the timeline marker.'
            }
          ]
        },
        {
          type: 'paragraph',
          marks: [{ type: 'timeline' }],
          content: []
        },
        {
          type: 'paragraph',
          content: []
        }
      ]
    };
  }
  
  function updateTimelinePosition() {
    if (!editor) return;
    
    const { doc } = editor.state;
    let timelinePos = null;
    
    // Find existing timeline mark
    doc.descendants((node, pos) => {
      if (node.marks.some(mark => mark.type.name === 'timeline')) {
        timelinePos = pos;
        return false; // Stop searching
      }
    });
    
    timelinePosition = timelinePos;
  }
  
  function handleSearch() {
    if (searchQuery.trim() && editor) {
      // Simple text search within editor
      const content = editor.getText();
      const searchIndex = content.toLowerCase().indexOf(searchQuery.toLowerCase());
      
      if (searchIndex !== -1) {
        // Focus editor and try to position cursor near found text
        editor.commands.focus();
        // Note: More sophisticated search/highlight would require additional extensions
        console.log('Found text at position:', searchIndex);
      } else {
        console.log('Text not found');
      }
    }
  }
  
  function focusAtEnd() {
    if (editor) {
      // Focus at the very end of the document
      editor.commands.focus('end');
      
      // Calculate position to center the last content line in viewport
      setTimeout(() => {
        const proseMirror = document.querySelector('.ProseMirror');
        if (proseMirror) {
          // Get the actual content height (excluding bottom padding)
          const contentHeight = proseMirror.scrollHeight - window.innerHeight; // Remove 100vh bottom padding
          const viewportHeight = window.innerHeight;
          
          // Center the last line of content in the viewport
          const targetScroll = contentHeight - (viewportHeight / 2);
          
          window.scrollTo({ 
            top: Math.max(0, targetScroll), 
            behavior: 'smooth' 
          });
        }
      }, 100);
    }
  }
  
  function addTodoList() {
    if (editor) {
      editor.commands.focus();
      editor.commands.toggleTaskList();
    }
  }
  
  function logout() {
    authActions.logout();
  }
</script>

<!-- Floating Top Controls -->
<div class="fixed top-4 left-4 right-4 z-50 pointer-events-none">
  <div class="flex items-start justify-between">
    <!-- Left: Phone number (red on hover) -->
    <div class="pointer-events-auto opacity-10 hover:opacity-100 transition-opacity duration-200">
      <button 
        on:click={logout}
        class="bg-white/90 backdrop-blur-md shadow-lg rounded-full px-4 py-2 transition-all duration-200"
      >
        <div class="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors">
          {$user?.phone || $user?.email || 'Loading...'}
        </div>
      </button>
    </div>
    
    <!-- Right: zai with online indicator -->
    <div class="pointer-events-auto opacity-10 hover:opacity-100 transition-opacity duration-200">
      <div class="bg-white/90 backdrop-blur-md shadow-lg rounded-full px-4 py-2 flex items-center space-x-2">
        <div class="text-sm text-gray-600 font-light tracking-wide">zai</div>
        <div 
          class="w-1.5 h-1.5 rounded-full {isOnline ? 'bg-green-500' : 'bg-gray-300'} transition-colors duration-200"
          title={isOnline ? 'Online' : 'Offline'}
        ></div>
      </div>
    </div>
  </div>
</div>

<!-- Editor with internal spacing -->
<div class="bg-white">
  <div 
    bind:this={element}
    class="prose max-w-prose mx-auto focus-within:outline-none px-8"
  />
</div>

<!-- Floating Bottom Controls -->
<div class="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
  <div class="max-w-4xl mx-auto px-4 py-3 flex items-center space-x-4 pointer-events-auto">
    <!-- Search Box -->
    <div class="flex-1 max-w-md relative">
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search notes..."
        class="w-full bg-white/90 backdrop-blur-md shadow-lg rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all border border-gray-200"
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
    
    <!-- Go to End Button -->
    <button
      on:click={focusAtEnd}
      class="bg-blue-600/90 backdrop-blur-md text-white rounded-full p-3 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center shadow-lg"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="6" r="3" />
        <path d="M12 9L12 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </button>
    
    <!-- Todo List Button -->
    <button
      on:click={addTodoList}
      class="bg-gray-400/90 backdrop-blur-md text-white rounded-full px-3 py-2 text-sm font-medium hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors flex items-center justify-center shadow-lg"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
      </svg>
    </button>
    
    <!-- Block Debug Toggle -->
    <button
      on:click={toggleBlockDebug}
      class="bg-purple-400/90 backdrop-blur-md text-white rounded-full px-3 py-2 text-sm font-medium hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 transition-colors flex items-center justify-center shadow-lg"
      title="Toggle block debug info"
    >
      📊
    </button>
    
    <!-- Sort Blocks Buttons -->
    <button
      on:click={() => sortBlocksByTimestampAction(true)}
      class="bg-green-400/90 backdrop-blur-md text-white rounded-full px-3 py-2 text-sm font-medium hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transition-colors flex items-center justify-center shadow-lg"
      title="Sort blocks by timestamp (ascending)"
    >
      ⬆️
    </button>
    
    <button
      on:click={() => sortBlocksByTimestampAction(false)}
      class="bg-red-400/90 backdrop-blur-md text-white rounded-full px-3 py-2 text-sm font-medium hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition-colors flex items-center justify-center shadow-lg"
      title="Sort blocks by timestamp (descending)"
    >
      ⬇️
    </button>
  </div>
</div>

<!-- Block Debug Panel -->
{#if showBlockDebug}
  <div class="fixed bottom-20 right-4 max-w-sm bg-white/95 backdrop-blur-md shadow-2xl rounded-lg p-4 border border-gray-200 z-40">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-gray-900">Block Debug Info</h3>
      <button on:click={() => showBlockDebug = false} class="text-gray-400 hover:text-gray-600">×</button>
    </div>
    
    <div class="space-y-2 text-xs text-gray-600">
      <div><strong>Total Blocks:</strong> {blockStats.total}</div>
      <div><strong>With Parents:</strong> {blockStats.withParents}</div>
      <div><strong>Orphaned:</strong> {blockStats.orphaned}</div>
      
      {#if Object.keys(blockStats.byType).length > 0}
        <div><strong>By Type:</strong></div>
        {#each Object.entries(blockStats.byType) as [type, count]}
          <div class="ml-2">• {type}: {count}</div>
        {/each}
      {/if}
      
      {#if blockStats.timeRange}
        <div><strong>Time Range:</strong></div>
        <div class="ml-2">From: {blockStats.timeRange.earliest.toLocaleString()}</div>
        <div class="ml-2">To: {blockStats.timeRange.latest.toLocaleString()}</div>
      {/if}
    </div>
  </div>
{/if}

<style>
  :global(.ProseMirror) {
    outline: none;
    padding: 30vh 1rem 100vh 1rem; /* Half screen top, full screen bottom */
    line-height: 1.25;
    height: 100%;
    font-family: 'Lora', serif;
    font-size: 12pt;
  }

  /* Block styling with borders */
  :global(.block-with-info) {
    border: 1px solid #000;
    border-radius: 0.375rem; /* rounded-md */
    padding: 0.5rem;
    margin: 0.25rem 0;
    position: relative;
  }

  :global(.block-with-info:hover) {
    background-color: rgba(0, 0, 0, 0.02);
    border-color: #4f46e5; /* Indigo border on hover */
  }

  /* Block info tooltip styling */
  :global(.block-info-tooltip) {
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    pointer-events: none;
    white-space: nowrap;
  }

  :global(.block-info-content) {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  :global(.block-info-row) {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  :global(.block-info-label) {
    color: #9ca3af;
    font-weight: 500;
  }

  :global(.block-info-value) {
    color: #f3f4f6;
    font-weight: 600;
  }

  /* Block indicator in left gutter */
  :global(.block-indicator) {
    position: absolute;
    left: -20px;
    color: #6b7280;
    font-size: 1rem;
    line-height: 1;
    opacity: 0.3;
    transition: opacity 0.2s;
  }

  :global(.block-with-info:hover .block-indicator) {
    opacity: 1;
    color: #4f46e5;
  }
  
  /* Apply consistent padding and remove margins from all paragraph-like elements */
  :global(.ProseMirror p),
  :global(.ProseMirror h1),
  :global(.ProseMirror h2), 
  :global(.ProseMirror h3),
  :global(.ProseMirror h4),
  :global(.ProseMirror h5),
  :global(.ProseMirror h6),
  :global(.ProseMirror li),
  :global(.ProseMirror blockquote),
  :global(.ProseMirror ul),
  :global(.ProseMirror ol) {
    padding: 0.25rem; /* p-1 equivalent */
    margin: 0; /* Remove all margins */
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
    min-height: 2px;
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
  
  /* Task list styles */
  :global(.ProseMirror ul[data-type="taskList"]) {
    list-style: none;
    padding: 0;
  }
  
  :global(.ProseMirror ul[data-type="taskList"] li) {
    display: flex;
    align-items: center; /* Center items vertically */
  }
  
  :global(.ProseMirror ul[data-type="taskList"] li > label) {
    flex: 0 0 auto;
    margin-right: 0.5rem;
    user-select: none;
    display: flex;
    align-items: center;
  }
  
  :global(.ProseMirror ul[data-type="taskList"] li > label > input[type="checkbox"]) {
    appearance: none;
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%; /* Make circular */
    border: 1px solid #d1d5db;
    margin: 0;
    cursor: pointer;
    background-color: white;
    position: relative;
    transition: all 0.2s ease;
  }
  
  :global(.ProseMirror ul[data-type="taskList"] li > label > input[type="checkbox"]:checked) {
    background-color: #3b82f6;
    border-color: #3b82f6;
  }
  
  :global(.ProseMirror ul[data-type="taskList"] li > label > input[type="checkbox"]:checked::after) {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 12px;
    font-weight: bold;
  }
  
  :global(.ProseMirror ul[data-type="taskList"] li > div) {
    flex: 1 1 auto;
  }
  
  /* Bullet list styles */
  :global(.ProseMirror ul:not([data-type="taskList"])) {
    list-style-type: disc;
    padding-left: 1.5rem;
  }
</style>
