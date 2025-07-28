<script>
  import { onMount, onDestroy } from 'svelte';
  import { dev } from '$app/environment';
  import { Editor } from '@tiptap/core';
  import Document from '@tiptap/extension-document';
  import Text from '@tiptap/extension-text';
  import StarterKit from '@tiptap/extension-starter-kit';
  import TaskList from '@tiptap/extension-task-list';
  import TaskItem from '@tiptap/extension-task-item';
  import Collaboration from '@tiptap/extension-collaboration';
  import Placeholder from '@tiptap/extension-placeholder';
  import ListKeymap from '@tiptap/extension-list-keymap';
  import * as Y from 'yjs';
  import { IndexeddbPersistence } from 'y-indexeddb';
  import { SupabaseProvider } from '$lib/providers/SupabaseProvider.js';
  import { user } from '$lib/stores/auth.js';
  import { authActions } from '$lib/stores/auth.js';
  import { TimelineMark } from '$lib/tiptap/TimelineMark.js';
  import { initializeSnowflakeGenerator } from '$lib/utils/snowflake.js';
  import { getAllBlocks, sortBlocksByTimestamp, getBlockStats } from '$lib/utils/blockSorting.js';
  
  // Extended nodes with metadata
  import { ExtendedParagraph } from '$lib/tiptap/ExtendedParagraph.js';
  import { ExtendedBulletList } from '$lib/tiptap/ExtendedBulletList.js';
  import { ExtendedTaskList } from '$lib/tiptap/ExtendedTaskList.js';
  import { ExtendedListItem } from '$lib/tiptap/ExtendedListItem.js';
  import { ExtendedTaskItem } from '$lib/tiptap/ExtendedTaskItem.js';
  import { ExtendedHeading } from '$lib/tiptap/ExtendedHeading.js';
  
  // Custom plugins
  import { BlockInfoDecorator } from '$lib/tiptap/BlockInfoDecorator.js';
  import { TimestampPlugin } from '$lib/tiptap/TimestampPlugin.js';
  import { MarkdownClipboard } from '$lib/tiptap/MarkdownClipboard.js';
  import { MarkdownPaste } from '$lib/tiptap/MarkdownPaste.js';

  let editor;
  let element;
  let searchQuery = '';
  let isOnline = false;
  
  // Block debug state
  let blockStats = { total: 0, byType: {}, withParents: 0, orphaned: 0, timeRange: null };
  let showBlockDebug = false;
  
  // Y.js document for collaboration
  const ydoc = new Y.Doc();
  let indexeddbProvider;
  let supabaseProvider;
  
  // Trigger jump behavior when user logs in
  $: if ($user && editor) {
    setTimeout(() => {
      focusAtEnd();
    }, 800); // Extra delay to ensure editor is fully loaded
  }
  
  onMount(() => {
    // Initialize snowflake generator with user ID (if available)
    const userId = $user?.id ? parseInt($user.id.slice(-8), 16) : 0;
    initializeSnowflakeGenerator(userId);
    
    // Check online status
    isOnline = navigator.onLine;
    
    editor = new Editor({
      element: element,
      extensions: [
        Document,
        Text,
        StarterKit.configure({
          history: false, // Y.js provides history
          document: false, // Y.js provides document management
          paragraph: false, // We use ExtendedParagraph
          bulletList: false, // We use ExtendedBulletList
          heading: false, // We use ExtendedHeading
        }),
        ExtendedParagraph,
        ExtendedBulletList,
        ExtendedTaskList,
        ExtendedListItem,
        ExtendedTaskItem,
        ExtendedHeading,
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        ListKeymap,
        Collaboration.configure({
          document: ydoc,
        }),
        Placeholder.configure({
          placeholder: 'What are you thinking about?',
        }),
        TimelineMark,
        BlockInfoDecorator,
        TimestampPlugin,
        MarkdownClipboard,
        MarkdownPaste,
      ],
      editorProps: {
        attributes: {
          class: 'prose prose-lg max-w-none focus:outline-none min-h-screen py-8',
        },
      },
      content: getInitialContent(),
      // No initial content - Y.js will manage document state
    });

    // Prevent task checkboxes from triggering editor focus on mobile
    setTimeout(() => {
      const editorElement = document.querySelector('.ProseMirror');
      if (editorElement) {
        editorElement.addEventListener('click', (event) => {
          // If clicking on a checkbox, prevent focus changes
          if (event.target.type === 'checkbox' && event.target.closest('[data-type="taskList"]')) {
            event.stopPropagation();
            // Don't prevent default - we want the checkbox to still toggle
            // Just prevent the click from bubbling up to focus the editor
          }
        }, true); // Use capture phase to catch it early
      }
    }, 100);

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
        editor.commands.setContent(getInitialContent());
        ydoc.getMap('config').set('initialContentLoaded', true);
        
        // Focus the editor after initialization (TimestampPlugin will handle IDs automatically)
        setTimeout(() => {
          editor.commands.focus();
          // Auto-trigger pin button behavior on load
          setTimeout(() => {
            focusAtEnd();
          }, 50);
        }, 50);
      }
    });
    
    // Update block stats when editor content changes
    if (editor) {
      editor.on('update', updateBlockStats);
      updateBlockStats(); // Initial calculation
    }
    
    // Handle auth state changes for Supabase provider
    user.subscribe(async (currentUser) => {
      if (currentUser && !supabaseProvider) {
        // User logged in, create provider
        supabaseProvider = new SupabaseProvider(documentName, ydoc, currentUser);
      } else if (!currentUser && supabaseProvider) {
        // User logged out, cleanup provider
        supabaseProvider.destroy();
        supabaseProvider = null;
      }
    });
    
    // Update timeline position every minute
    const timelineInterval = setInterval(updateTimelinePosition, 60000);
    
    return () => {
      clearInterval(timelineInterval);
    };
  });

  function getInitialContent() {
    return '<p></p>'; // Single empty paragraph to start
  }

  function updateBlockStats() {
    if (!editor) return;
    
    const blocks = getAllBlocks(editor);
    blockStats = getBlockStats(blocks);
  }

  function handleSearch() {
    if (!searchQuery.trim() || !editor) return;
    
    // Simple search implementation
    const { view } = editor;
    const { state } = view;
    const { doc } = state;
    
    let found = false;
    let searchPos = 0;
    
    doc.descendants((node, pos) => {
      if (found) return false;
      
      if (node.isText && node.text && node.text.toLowerCase().includes(searchQuery.toLowerCase())) {
        const from = pos;
        const to = pos + searchQuery.length;
        
        // Create selection at found text
        const selection = editor.state.selection.constructor.create(
          editor.state.doc, 
          from, 
          to
        );
        
        // Apply selection and scroll into view
        editor.view.dispatch(
          editor.state.tr.setSelection(selection).scrollIntoView()
        );
        
        found = true;
        return false;
      }
    });
    
    if (!found) {
      // Could show "not found" message
      console.log('Text not found:', searchQuery);
    }
  }

  function updateTimelinePosition() {
    if (!editor) return;
    
    // Find existing timeline mark and update its position
    const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // For now, just update if timeline mark exists
    // Future: implement smart positioning based on time
  }

  function sortBlocksByTimestampAction(ascending = true) {
    if (!editor) return;
    
    const blocks = getAllBlocks(editor);
    const sortedBlocks = sortBlocksByTimestamp(blocks, ascending);
    
    console.log(`Sorted ${sortedBlocks.length} blocks ${ascending ? 'ascending' : 'descending'} by timestamp:`, sortedBlocks);
    
    // Update block stats after sorting
    updateBlockStats();
  }

  function toggleBlockDebug() {
    showBlockDebug = !showBlockDebug;
    updateBlockStats(); // Refresh stats when toggling
  }

  function focusAtEnd() {
    if (!editor) return;
    
    // Count trailing empty paragraphs at end of document
    const { doc } = editor.state;
    const docSize = doc.content.size;
    
    let trailingEmptyParagraphs = 0;
    
    // Traverse backwards from end to count empty paragraphs
    for (let pos = docSize - 2; pos >= 0; pos--) {
      const resolved = doc.resolve(pos);
      const node = resolved.node();
      
      if (node && node.type.name === 'paragraph' && (!node.content || node.content.size === 0)) {
        trailingEmptyParagraphs++;
      } else {
        break; // Stop at first non-empty paragraph
      }
    }
    
    // Ensure exactly 3 trailing empty paragraphs
    if (trailingEmptyParagraphs < 3) {
      // Add paragraphs to reach 3
      const paragraphsToAdd = 3 - trailingEmptyParagraphs;
      const tr = editor.state.tr;
      
      for (let i = 0; i < paragraphsToAdd; i++) {
        const paragraph = editor.state.schema.nodes.paragraph.create();
        tr.insert(tr.doc.content.size, paragraph);
      }
      
      editor.view.dispatch(tr);
    } else if (trailingEmptyParagraphs > 3) {
      // Remove excess paragraphs to have exactly 3
      const paragraphsToRemove = trailingEmptyParagraphs - 3;
      const tr = editor.state.tr;
      
      // Remove from the end backwards
      for (let i = 0; i < paragraphsToRemove; i++) {
        // Find and remove the last empty paragraph
        for (let pos = tr.doc.content.size - 2; pos >= 0; pos--) {
          const resolved = tr.doc.resolve(pos);
          const node = resolved.node();
          
          if (node && node.type.name === 'paragraph' && (!node.content || node.content.size === 0)) {
            const nodeStart = resolved.start() - 1;
            const nodeEnd = resolved.end() + 1;
            tr.delete(nodeStart, nodeEnd);
            break;
          }
        }
      }
      
      editor.view.dispatch(tr);
    }
    
    // Scroll first, then focus to prevent jumping
    setTimeout(() => {
      const proseMirror = document.querySelector('.ProseMirror');
      if (proseMirror) {
        // Force layout recalculation to ensure accurate measurements
        proseMirror.offsetHeight;
        
        // Get the actual content height (excluding bottom padding)
        const contentHeight = proseMirror.scrollHeight - window.innerHeight;
        const viewportHeight = window.innerHeight;
        
        // Center the last line of content in the viewport
        const targetScroll = contentHeight - (viewportHeight / 2);
        
        window.scrollTo({ 
          top: Math.max(0, targetScroll), 
          behavior: 'smooth' 
        });
        
        // Focus after scroll animation completes
        setTimeout(() => {
          editor.commands.focus('end');
        }, 600); // Wait for smooth scroll to complete
      }
    }, 200);
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
    <!-- Left: Logout button -->
    <div class="pointer-events-auto opacity-10 hover:opacity-100 transition-opacity duration-200">
      <button
        on:click={logout}
        class="bg-white/90 backdrop-blur-md shadow-lg rounded-full px-4 py-2"
      >
        <div class="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors">
          sign out
        </div>
      </button>
    </div>
    
    <!-- Right: Debug button and zai with online indicator -->
    <div class="flex items-center space-x-2 pointer-events-auto">
      <!-- Debug Button -->
      <button
        on:click={toggleBlockDebug}
        class="opacity-10 hover:opacity-100 transition-opacity duration-200 bg-white/90 backdrop-blur-md shadow-lg rounded-full p-2"
        title="Toggle block debug info"
      >
        <div class="text-xs">📊</div>
      </button>
      
      <!-- Zai with online indicator -->
      <div class="opacity-10 hover:opacity-100 transition-opacity duration-200">
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
</div>

<!-- Dev Version Tag -->
{#if dev}
  <div class="fixed top-4 right-4 z-50 pointer-events-none">
    <div class="bg-gray-900 text-white px-2 py-1 rounded text-xs font-mono">
      Tooltip Flag Mobile Fix
    </div>
  </div>
{/if}

<!-- Editor with internal spacing -->
<div class="bg-white">
  <div 
    bind:this={element}
    class="prose max-w-prose mx-auto focus-within:outline-none px-8"
    tabindex="0"
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
        tabindex="-1"
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
      tabindex="-1"
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
      tabindex="-1"
      class="bg-gray-400/90 backdrop-blur-md text-white rounded-full px-3 py-2 text-sm font-medium hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors flex items-center justify-center shadow-lg"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
      </svg>
    </button>
    
    <!-- Sort Blocks Buttons -->
    <button
      on:click={() => sortBlocksByTimestampAction(true)}
      tabindex="-1"
      class="bg-green-400/90 backdrop-blur-md text-white rounded-full px-3 py-2 text-sm font-medium hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transition-colors flex items-center justify-center shadow-lg"
      title="Sort blocks by timestamp (ascending)"
    >
      ⬆️
    </button>
    
    <button
      on:click={() => sortBlocksByTimestampAction(false)}
      tabindex="-1"
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
      <h3 class="text-sm font-semibold text-gray-900">Block Debug</h3>
      <button
        on:click={toggleBlockDebug}
        class="text-gray-400 hover:text-gray-600"
      >×</button>
    </div>
    
    <div class="space-y-2 text-xs text-gray-600">
      <div>
        <strong>Total Blocks:</strong> {blockStats.total}
      </div>
      
      {#if Object.keys(blockStats.byType).length > 0}
        <div><strong>By Type:</strong></div>
        {#each Object.entries(blockStats.byType) as [type, count]}
          <div class="ml-2">• {type}: {count}</div>
        {/each}
      {/if}
      
      <div><strong>With Parents:</strong> {blockStats.withParents}</div>
      <div><strong>Orphaned:</strong> {blockStats.orphaned}</div>
      
      {#if blockStats.timeRange}
        <div class="ml-2">From: {blockStats.timeRange.earliest.toLocaleString()}</div>
        <div class="ml-2">To: {blockStats.timeRange.latest.toLocaleString()}</div>
      {/if}
    </div>
  </div>
{/if}

<style>
  :global(:root) {
    --debug-borders: none; /* Change to "1px solid red" to show debug borders */
    --block-borders: none; /* Change to "1px solid #000" to show block borders */
    --block-hover-bg: none; /* Change to "rgba(0, 0, 0, 0.02)" to show hover background */
    --block-tooltips: none; /* Change to "block" to show block hover tooltips */
  }

  :global(.ProseMirror) {
    outline: none;
    white-space: pre-wrap;
  }

  :global(.block-info-tooltip) {
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 11px;
    font-family: monospace;
    pointer-events: none;
    user-select: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  :global(.block-info-content) {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  :global(.block-info-row) {
    display: flex;
    gap: 8px;
  }

  :global(.block-info-label) {
    color: #888;
    min-width: 50px;
  }

  :global(.block-info-value) {
    color: white;
    font-weight: 500;
  }

  /* Block metadata styling with visual controls */
  :global(.block-with-info) {
    border: var(--block-borders);
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  :global(.block-with-info:hover) {
    background: var(--block-hover-bg);
  }

  /* Timeline mark styling */
  :global(.timeline-mark) {
    display: inline-block;
    background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    margin: 0 4px;
    vertical-align: middle;
    user-select: none;
    box-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
  }

  /* Task list styling improvements */
  :global(.ProseMirror > ul[data-type="taskList"] li input[type="checkbox"]) {
    margin-right: 0.5rem;
  }

  :global(.ProseMirror ul) {
    padding-left: 1rem;
  }

  :global(.ProseMirror ol) {
    padding-left: 1rem;
  }

  :global(.ProseMirror ul[data-type="taskList"]) {
    padding-left: 1rem;
  }

  /* Dash bullet styling for bullet lists only */
  :global(.ProseMirror ul:not([data-type="taskList"]) li::before) {
    content: '–';
    position: absolute;
    left: -0.75rem;
    color: #6b7280;
    font-weight: 500;
  }

  :global(.ProseMirror ul:not([data-type="taskList"]) li) {
    position: relative;
    list-style: none;
  }

  /* Task list checkboxes positioned at top */
  :global(.ProseMirror ul[data-type="taskList"] li > label > input[type="checkbox"]) {
    position: absolute;
    left: 0;
    top: 0.125rem;
    margin: 0;
    transform: none;
    border: var(--debug-borders);
  }

  :global(.ProseMirror ul[data-type="taskList"] li > label) {
    position: relative;
    display: block;
    padding-left: 1.5rem;
    border: var(--debug-borders);
  }

  :global(.ProseMirror ul[data-type="taskList"] li > label > input[type="checkbox"]:checked) {
    background-color: #3b82f6;
    border-color: #3b82f6;
  }

  :global(.ProseMirror ul[data-type="taskList"] li > label > input[type="checkbox"]:checked::after) {
    content: '✓';
    position: absolute;
    left: 2px;
    top: -1px;
    color: white;
    font-size: 10px;
    font-weight: bold;
  }

  /* Remove padding from list item blocks to prevent double spacing */
  :global(.ProseMirror ul li.block-with-info),
  :global(.ProseMirror ol li.block-with-info) {
    padding: 0;
  }
</style> 