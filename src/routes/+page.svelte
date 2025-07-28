<script>
  import { onMount, onDestroy } from 'svelte';
  import { Editor } from '@tiptap/core';
  import Document from '@tiptap/extension-document';
  import Text from '@tiptap/extension-text';
  import { ExtendedHeading } from '$lib/tiptap/ExtendedHeading.js';
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
  import { TimestampPlugin } from '$lib/tiptap/TimestampPlugin.js';
  import { MarkdownClipboard } from '$lib/tiptap/MarkdownClipboard.js';
  import { MarkdownPaste } from '$lib/tiptap/MarkdownPaste.js';
  import ListKeymap from '@tiptap/extension-list-keymap';
  import { initializeSnowflakeGenerator } from '$lib/utils/snowflake.js';
  import { getAllBlocks, sortBlocksByTimestamp, getBlockStats } from '$lib/utils/blockSorting.js';
  import { TagMention } from '$lib/tiptap/TagMention.js';
  import { TagParser } from '$lib/tiptap/TagParser.js';
  import { InputRuleTagParser } from '$lib/tiptap/InputRuleTagParser.js';
  import { KeyboardNavigation } from '$lib/tiptap/KeyboardNavigationPlugin.js';
  import { tagManager, isTagProcessing, tagStats } from '$lib/utils/tagManager.js';
  import { dev } from '$app/environment';
  
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
  
  // Mobile UI state
  let isSearchExpanded = false;
  let keyboardHeight = 0;
  
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
        ExtendedHeading.configure({
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
        TimestampPlugin, // Automatically adds timestamps without interfering with keymaps
        MarkdownClipboard, // Copy/cut as markdown instead of HTML
        MarkdownPaste, // Parse pasted markdown into proper nodes
        TagMention, // Tag mentions with # trigger
        TagParser, // Auto-convert hashtags to tag mentions
        InputRuleTagParser, // Convert hashtags on typing
        KeyboardNavigation, // Remove tab index from irrelevant elements
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
        
        // Focus the editor after initialization (TimestampPlugin will handle IDs automatically)
        setTimeout(() => {
          editor.commands.focus();
          // Auto-trigger pin button behavior on load with longer delay
          setTimeout(() => {
            focusAtEnd();
          }, 50);
        }, 50);
      }
    });
    
    // Update block stats and extract tags periodically
    if (editor) {
      const updateStats = () => {
        const blocks = getAllBlocks(editor);
        blockStats = getBlockStats(blocks);
      };
      
      const extractTags = async () => {
        if (!editor) return;
        
        try {
          // Use HTML content instead of text to preserve tag mentions
          const content = editor.getHTML();
          await tagManager.extractTags(content);
        } catch (error) {
          console.error('Error extracting tags:', error);
        }
      };
      
      // Update stats on editor changes
      editor.on('update', () => {
        updateStats();
        // Debounce tag extraction to avoid excessive processing
        clearTimeout(window.tagExtractionTimeout);
        window.tagExtractionTimeout = setTimeout(extractTags, 2000);
      });
      
      // Update stats every 10 seconds
      const statsInterval = setInterval(updateStats, 10000);
      
      // Initial tag extraction
      setTimeout(extractTags, 1000);
      
      return () => {
        clearInterval(statsInterval);
        clearTimeout(window.tagExtractionTimeout);
      };
    }

    // Set initial timeline position
    updateTimelinePosition();
    
    // Update timeline position every minute
    const timelineInterval = setInterval(updateTimelinePosition, 60000);
    
    // Set up virtual keyboard detection for mobile
    const setupVirtualKeyboard = () => {
      // Try VirtualKeyboard API first (Chrome Android)
      if ('virtualKeyboard' in navigator) {
        navigator.virtualKeyboard.overlaysContent = true;
        navigator.virtualKeyboard.addEventListener('geometrychange', (event) => {
          keyboardHeight = event.target.boundingRect.height;
        });
      }
      // Fallback to visualViewport API for other browsers
      else if ('visualViewport' in window) {
        const updateKeyboardHeight = () => {
          const vpHeight = window.visualViewport.height;
          const windowHeight = window.innerHeight;
          keyboardHeight = Math.max(0, windowHeight - vpHeight);
        };
        
        window.visualViewport.addEventListener('resize', updateKeyboardHeight);
        window.visualViewport.addEventListener('scroll', updateKeyboardHeight);
      }
    };
    
    setupVirtualKeyboard();
    
    return () => {
      clearInterval(timelineInterval);
    };
  });

  onDestroy(() => {
    // Clear timeouts
    clearTimeout(window.tagExtractionTimeout);
    
    // Cleanup tag manager
    tagManager.destroy();
    
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
  
  // Removed initializeExistingBlocks - TimestampPlugin handles this automatically without duplication

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
          marks: [{ type: 'timeline' }],
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
    if (!editor) return;
    
    // Get current document state
    const { doc } = editor.state;
    const docSize = doc.content.size;
    
    // Count existing paragraphs at the end
    let trailingEmptyParagraphs = 0;
    let lastPos = docSize;
    
    // Walk backwards from the end to count empty paragraphs
    for (let pos = docSize - 2; pos >= 0; pos--) {
      try {
        const node = doc.nodeAt(pos);
        if (node && node.type.name === 'paragraph' && node.textContent.trim() === '') {
          trailingEmptyParagraphs++;
          lastPos = pos;
        } else if (node && node.type.name === 'paragraph') {
          // Hit a non-empty paragraph, stop counting
          break;
        }
      } catch (e) {
        break;
      }
    }
    
    // Ensure exactly 3 empty paragraphs at the end
    if (trailingEmptyParagraphs < 3) {
      // Add top-level paragraphs to reach 3
      const needed = 3 - trailingEmptyParagraphs;
      const { tr } = editor.state;
      
      for (let i = 0; i < needed; i++) {
        // Insert at document end as top-level paragraph
        const paragraph = editor.state.schema.nodes.paragraph.create();
        tr.insert(tr.doc.content.size, paragraph);
      }
      
      editor.view.dispatch(tr);
    } else if (trailingEmptyParagraphs > 3) {
      // Remove excess paragraphs from the end
      const toRemove = trailingEmptyParagraphs - 3;
      const { tr } = editor.state;
      
      // Walk backwards and remove excess empty paragraphs
      let removed = 0;
      for (let pos = tr.doc.content.size - 2; pos >= 0 && removed < toRemove; pos--) {
        try {
          const node = tr.doc.nodeAt(pos);
          if (node && node.type.name === 'paragraph' && node.textContent.trim() === '') {
            tr.delete(pos, pos + node.nodeSize);
            removed++;
          }
        } catch (e) {
          break;
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
    }, 50);
  }
  
  function addTodoList() {
    if (editor) {
      editor.commands.focus();
      editor.commands.toggleTaskList();
    }
  }
  
  function toggleSearchExpanded() {
    isSearchExpanded = !isSearchExpanded;
    if (isSearchExpanded) {
      // Focus search input when expanded
      setTimeout(() => {
        const searchInput = document.querySelector('.mobile-search-input');
        if (searchInput) searchInput.focus();
      }, 100);
    }
  }
  
  function indentList() {
    if (editor) {
      editor.commands.focus();
      editor.commands.sinkListItem('listItem') || editor.commands.sinkListItem('taskItem');
    }
  }
  
  function outdentList() {
    if (editor) {
      editor.commands.focus();
      editor.commands.liftListItem('listItem') || editor.commands.liftListItem('taskItem');
    }
  }
  
  function addLink() {
    if (editor) {
      editor.commands.focus();
      // Simple link insertion - could be enhanced with a modal
      const url = prompt('Enter URL:');
      if (url) {
        editor.commands.setLink({ href: url });
      }
    }
  }
  
  function logout() {
    authActions.logout();
  }
</script>

<!-- Development Version Tag -->
{#if dev}
  <div class="fixed top-4 right-4 z-[60] pointer-events-none">
    <div class="bg-purple-600/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded shadow-lg font-mono">
      ecosystem-native-v7
    </div>
  </div>
{/if}

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
    
    <!-- Right: Tag processing indicator, Debug button and zai with online indicator -->
    <div class="flex items-center space-x-2 pointer-events-auto">
      <!-- Tag Processing Indicator -->
      {#if $isTagProcessing}
        <div class="bg-blue-100/90 backdrop-blur-md shadow-lg rounded-full p-2 animate-pulse"
             title="Processing tags...">
          <div class="text-xs">🏷️</div>
        </div>
      {/if}
      
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

<!-- Editor with internal spacing -->
<div class="bg-white">
  <div 
    bind:this={element}
    class="prose max-w-prose mx-auto focus-within:outline-none px-8"
    tabindex="0"
  />
</div>

<!-- Floating Bottom Controls -->
<div 
  class="fixed left-0 right-0 z-50 pointer-events-none transition-all duration-300"
  style="bottom: {keyboardHeight}px"
>
  <div class="max-w-4xl mx-auto px-4 py-3 pointer-events-auto">
    
    <!-- Mobile Expanded Search -->
    {#if isSearchExpanded}
      <div class="flex items-center space-x-3 justify-center">
        <div class="flex-1 max-w-md relative">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search notes..."
            class="mobile-search-input w-full bg-white/90 backdrop-blur-md shadow-lg rounded-full pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all border border-gray-200"
            on:keypress={(e) => e.key === 'Enter' && handleSearch()}
            on:blur={() => isSearchExpanded = false}
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
        
        <button
          on:click={toggleSearchExpanded}
          class="bg-gray-400/90 backdrop-blur-md text-white rounded-full p-3 hover:bg-gray-500 transition-colors shadow-lg"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    {:else}
      <!-- Default Button Layout -->
      <div class="flex items-center justify-center space-x-3">
        
        <!-- Search Button (Mobile) / Search Box (Desktop) -->
        <div class="md:flex-1 md:max-w-md md:relative">
          <!-- Desktop Search Box -->
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search notes..."
            tabindex="-1"
            class="hidden md:block w-full bg-white/90 backdrop-blur-md shadow-lg rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all border border-gray-200"
            on:keypress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            on:click={handleSearch}
            class="hidden md:block absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </button>
          
          <!-- Mobile Search Button -->
          <button
            on:click={toggleSearchExpanded}
            tabindex="-1"
            class="md:hidden bg-white/90 backdrop-blur-md text-gray-700 rounded-full p-3 hover:bg-gray-100 transition-colors shadow-lg border border-gray-200"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </button>
        </div>
        
        <!-- Tool Bar (Long Pill) -->
        <div class="bg-white/90 backdrop-blur-md shadow-lg rounded-full border border-gray-200 flex items-center divide-x divide-gray-200">
          <!-- Outdent -->
          <button
            on:click={outdentList}
            tabindex="-1"
            class="px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-l-full"
            title="Outdent"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <!-- Two lines representing text, first line normal -->
              <rect x="2" y="3" width="10" height="1.5" rx="0.5"/>
              <rect x="2" y="7" width="12" height="1.5" rx="0.5"/>
              <!-- Small left chevron to show outdenting -->
              <path d="M1 5.5l1.5-1.5L1 2.5v3z" fill="currentColor"/>
            </svg>
          </button>
          
          <!-- Indent -->
          <button
            on:click={indentList}
            tabindex="-1"
            class="px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Indent"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <!-- Two lines representing text, first line indented -->
              <rect x="4" y="3" width="10" height="1.5" rx="0.5"/>
              <rect x="2" y="7" width="12" height="1.5" rx="0.5"/>
              <!-- Small right chevron to show indenting -->
              <path d="M2.5 2.5L4 4 2.5 5.5V2.5z" fill="currentColor"/>
            </svg>
          </button>
          
          <!-- Todo List -->
          <button
            on:click={addTodoList}
            tabindex="-1"
            class="px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Add Todo List"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
            </svg>
          </button>
          
          <!-- Link -->
          <button
            on:click={addLink}
            tabindex="-1"
            class="px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-r-full"
            title="Add Link"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
            </svg>
          </button>
        </div>
        
        <!-- Jump to End Button -->
        <button
          on:click={focusAtEnd}
          tabindex="-1"
          class="bg-blue-600/90 backdrop-blur-md text-white rounded-full p-3 hover:bg-blue-700 transition-colors shadow-lg"
          title="Jump to End"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="6" r="3" />
            <path d="M12 9L12 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
        

      </div>
    {/if}
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
  :global(:root) {
    --debug-borders: none; /* Change to "1px solid red" to show debug borders */
    --block-borders: none; /* Change to "1px solid #000" to show block borders */
    --block-hover-bg: none; /* Change to "rgba(0, 0, 0, 0.02)" to show hover background */
  }

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
    border: var(--block-borders);
    border-radius: 0.375rem; /* rounded-md */
    padding: 0.5rem;
    margin: 0.25rem 0;
    position: relative;
  }

  /* Remove padding from list items - paragraphs inside provide sufficient spacing */
  :global(li.block-with-info) {
    padding: 0 !important;
    margin-top: -0.1rem !important;
  }

  :global(.block-with-info:hover) {
    background-color: var(--block-hover-bg);
    border-color: #4f46e5; /* Indigo border on hover (only when borders are enabled) */
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

  /* Fix bullet point positioning to stay at top of first line */
  :global(.ProseMirror ul),
  :global(.ProseMirror ol) {
    padding-left: 1rem; /* 16px */
  }
  
  :global(.ProseMirror li) {
    position: relative;
    list-style-position: outside;
    margin-bottom: 0.25rem;
    padding: 0; /* Remove default padding - paragraph inside has sufficient padding */
  }
  
  :global(.ProseMirror ul li) {
    list-style-type: none;
    position: relative;
  }
  
  /* Dash decoration only for bullet lists, not task lists */
  :global(.ProseMirror ul:not([data-type="taskList"]) li::before) {
    content: "-";
    position: absolute;
    left: -1rem; /* Adjusted for 16px padding */
    top: 0.3rem;
    color: currentColor;
    font-weight: normal;
  }
  
  :global(.ProseMirror ul li::marker),
  :global(.ProseMirror ol li::marker) {
    position: absolute;
    top: 0;
  }
  
  /* Task list specific styling */
  :global(.ProseMirror ul[data-type="taskList"] li) {
    list-style: none;
    position: relative;
    padding: 0;
    padding-left: 1rem; /* 16px - Only left padding for checkbox space */
  }
  
  :global(.ProseMirror > ul[data-type="taskList"] li input[type="checkbox"]) {
    position: absolute;
    left: 0;
    top: 0.125rem; /* Align with first line of text */
    margin: 0;
    z-index: 1;
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
  
  /* Tag mention styling */
  :global(.tag-mention) {
    background-color: #dbeafe;
    color: #1e40af;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  :global(.tag-mention:hover) {
    background-color: #bfdbfe;
    color: #1d4ed8;
  }
  
  /* Tag suggestions styling */
  :global(.tag-suggestions) {
    z-index: 999;
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
    align-items: flex-start; /* Center items vertically */
  }
  
  :global(.ProseMirror ul[data-type="taskList"] li > label) {
    width: 1rem;
    height: 1.75rem;
    margin-left: 0.25rem;
    margin-right: 0.25rem;
    user-select: none;
    display: flex;
    align-items: center;
          border: var(--debug-borders);
  }
  
  :global(.ProseMirror ul[data-type="taskList"] li > label > input[type="checkbox"]) {
    appearance: none;
    -webkit-appearance: none;
    width: 1rem;
    height: 1rem;
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
          border: var(--debug-borders);
  }
  
  /* Bullet list styles */
  :global(.ProseMirror ul:not([data-type="taskList"])) {
    list-style-type: disc;
    padding-left: 1.5rem;
  }
</style>
