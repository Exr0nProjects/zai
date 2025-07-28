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
  import Link from '@tiptap/extension-link';
  import BubbleMenu from '@tiptap/extension-bubble-menu';
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
  
  // Mobile UI state
  let isSearchExpanded = false;
  let keyboardHeight = 0;
  
  // Link management
  let linkMenuElement;
  let showLinkMenu = false;
  let linkUrl = '';
  let originalLinkUrl = ''; // Track original URL for cancel behavior
  let isEditingLink = false;
  let isHoveringLink = false; // Track if hovering over a link
  let linkContextMenu = false; // Track right-click/long-press
  
  // Get current link URL from DOM
  function getCurrentLinkUrl() {
    if (!editor) return '';
    
    // Use TipTap's current state to get link attributes
    if (editor.isActive('link')) {
      const attrs = editor.getAttributes('link');
      return attrs.href || '';
    }
    
    return '';
  }
  
  // Y.js document for collaboration
  const ydoc = new Y.Doc();
  let indexeddbProvider;
  let supabaseProvider;

  // Create link menu element early so it's available for BubbleMenu
  if (typeof document !== 'undefined') {
    linkMenuElement = document.createElement('div');
    linkMenuElement.className = 'link-bubble-menu';
  }
  
  // Define addLink function early for keyboard shortcut
  function addLink() {
    if (editor) {
      editor.commands.focus();
      
      // Check if we're already in a link
      const { href } = editor.getAttributes('link');
      if (href) {
        // Already in a link, bubble menu will show automatically
        return;
      }
      
      // Not in a link - show pill interface for creating new link
      linkUrl = '';
      originalLinkUrl = ''; // No original URL for new links
      isEditingLink = false;
      showLinkMenu = true;
      
      // Temporarily set a placeholder link to make bubble menu appear
      const { from, to } = editor.state.selection;
      if (from === to) {
        // No text selected, insert placeholder text and link
        editor.commands.insertContent('<a href="">Link</a>');
        // Select the text so user can see it
        editor.commands.setTextSelection(from, from + 4);
      } else {
        // Text selected, apply placeholder link
        editor.commands.setLink({ href: '' });
      }
      
      // Blur editor after setting up link to prevent keyboard conflicts
      setTimeout(() => {
        if (editor?.view?.dom) {
          editor.view.dom.blur();
        }
        
        // Aggressively focus the input after blurring editor
        setTimeout(() => {
          const input = document.querySelector('.link-bubble-menu input[type="url"]');
          if (input) {
            input.focus();
            input.select();
          }
        }, 10);
      }, 50);
    }
  }
  
  // URL normalization function - adds https:// if missing
  function normalizeUrl(url) {
    const trimmed = url.trim();
    if (!trimmed) return '';
    
    // Add https:// if no protocol is present
    if (!trimmed.match(/^https?:\/\//i)) {
      return 'https://' + trimmed;
    }
    return trimmed;
  }
  
  // Fix applyLink function to work properly
  function applyLink() {
    const normalizedUrl = normalizeUrl(linkUrl);
    if (!normalizedUrl) return;
    
    if (editor) {
      const { from, to } = editor.state.selection;
      
      if (isEditingLink) {
        // Update existing link (when editing via bubble menu)
        editor.commands.updateAttributes('link', { href: normalizedUrl });
      } else if (from === to) {
        // No text selected, insert link with URL as text
        editor.commands.insertContent(`<a href="${normalizedUrl}">${normalizedUrl}</a>`);
      } else {
        // Text selected, apply link to selection
        editor.commands.setLink({ href: normalizedUrl });
      }
      
      // Clean up state
      showLinkMenu = false;
      linkUrl = '';
      originalLinkUrl = '';
      isEditingLink = false;
      isHoveringLink = false;
      linkContextMenu = false;
      
      // Focus back to editor after a brief delay
      setTimeout(() => {
        if (editor) {
          editor.commands.focus();
        }
      }, 100);
    }
  }
  
  // Custom Link extension with keyboard shortcut
  const CustomLink = Link.configure({
    openOnClick: true, // Enable click to navigate
    enableClickSelection: true,
    HTMLAttributes: {
      class: 'text-blue-600 cursor-pointer',
      style: 'text-decoration: none !important;', // Force remove underlines
    },
  }).extend({
    addKeyboardShortcuts() {
      return {
        'Mod-k': () => {
          // Call our addLink function when Cmd+K is pressed
          addLink();
          return true;
        },
      };
    },
  });
  
  // Trigger jump behavior when user logs in
  $: if ($user && editor) {
    setTimeout(() => {
      focusAtEnd();
    }, 800); // Extra delay to ensure editor is fully loaded
  }
  
  // Auto-show edit mode for new empty links
  $: if (editor && editor.isActive('link')) {
    const { href } = editor.getAttributes('link');
    if (!href || href === '') {
      if (!showLinkMenu) {
        linkUrl = '';
        originalLinkUrl = '';
        isEditingLink = false;
        showLinkMenu = true;
      }
    }
  }
  
  // Auto-focus input when entering edit mode
  $: if (showLinkMenu) {
    // Immediate focus attempt
    const focusInput = () => {
      const input = document.querySelector('.link-bubble-menu input[type="url"]');
      if (input) {
        input.focus();
        input.select();
        return true;
      }
      return false;
    };
    
    // Try multiple times with different delays to ensure focus
    setTimeout(() => focusInput(), 0);
    setTimeout(() => focusInput(), 50);
    setTimeout(() => focusInput(), 100);
    setTimeout(() => focusInput(), 150);
  }
  
  // Calculate dynamic pill width based on content
  $: pillWidth = (() => {
    if (showLinkMenu) {
      // When editing, base width on input placeholder or current value + extra padding
      const text = linkUrl || 'https://example.com';
      return Math.max(140, Math.min(450, text.length * 8 + 100)); // More padding: 140 min, 450 max, +100 padding
    } else {
      // When displaying, base width on current link URL + padding
      const text = getCurrentLinkUrl() || 'New link';
      return Math.max(120, Math.min(400, text.length * 8 + 80)); // Standard padding for display
    }
  })();
  
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
        
        // Link support
        CustomLink,
        
        // Y.js Collaboration extension (replaces History)
        Collaboration.configure({
          document: ydoc,
        }),
        
        // Bubble menu for links
        BubbleMenu.configure({
          element: linkMenuElement,
          shouldShow: ({ editor }) => {
            // Show when editing, hovering over a link, or context menu is active
            return editor.isActive('link') && (showLinkMenu || isHoveringLink || linkContextMenu);
          },
          pluginKey: 'linkBubbleMenu',
          tippyOptions: {
            placement: 'top',
            offset: [0, 8],
            arrow: false,
            interactive: true,
            onShow: () => {
              // Set hover state when bubble shows
              isHoveringLink = true;
            },
            onHide: () => {
              // Clear hover state when bubble hides (unless we're editing)
              if (!showLinkMenu) {
                isHoveringLink = false;
                linkContextMenu = false;
              }
            },
            getReferenceClientRect: () => {
              // Use the selection range for better positioning
              const { ranges } = editor.state.selection;
              const from = Math.min(...ranges.map(range => range.$from.pos));
              const to = Math.max(...ranges.map(range => range.$to.pos));
              
              if (editor.view.domAtPos) {
                const start = editor.view.domAtPos(from);
                const end = editor.view.domAtPos(to);
                
                if (start.node && end.node) {
                  const range = document.createRange();
                  range.setStart(start.node, start.offset);
                  range.setEnd(end.node, end.offset);
                  return range.getBoundingClientRect();
                }
              }
              
              // Fallback to default behavior
              return editor.view.dom.getBoundingClientRect();
            },
          },
        }),
        
        TimelineMark,
        BlockInfoDecorator,
        TimestampPlugin, // Automatically adds timestamps without interfering with keymaps
        MarkdownClipboard, // Copy/cut as markdown instead of HTML
        MarkdownPaste, // Parse pasted markdown into proper nodes
        Placeholder.configure({
          placeholder: 'What do you think?',
        }),
      ],
      // No initial content - Y.js will manage document state
    });

    // Add link interaction handlers after editor is created
    setTimeout(() => {
      if (editor && editor.view.dom) {
        const editorDom = editor.view.dom;
        
        // Handle hover events on links
        editorDom.addEventListener('mouseover', (e) => {
          const target = e.target.closest('a[href]');
          if (target && editor.isActive('link')) {
            isHoveringLink = true;
          }
        });
        
        editorDom.addEventListener('mouseout', (e) => {
          const target = e.target.closest('a[href]');
          if (target && !showLinkMenu) {
            isHoveringLink = false;
          }
        });
        
        // Handle right-click on links
        editorDom.addEventListener('contextmenu', (e) => {
          const target = e.target.closest('a[href]');
          if (target && editor.isActive('link')) {
            e.preventDefault();
            linkContextMenu = true;
            isHoveringLink = true;
          }
        });
        
        // Handle long-press on links (touch devices)
        let longPressTimer;
        editorDom.addEventListener('touchstart', (e) => {
          const target = e.target.closest('a[href]');
          if (target && editor.isActive('link')) {
            longPressTimer = setTimeout(() => {
              e.preventDefault();
              linkContextMenu = true;
              isHoveringLink = true;
            }, 500); // 500ms long press
          }
        });
        
        editorDom.addEventListener('touchend', () => {
          if (longPressTimer) {
            clearTimeout(longPressTimer);
          }
        });
        
        editorDom.addEventListener('touchmove', () => {
          if (longPressTimer) {
            clearTimeout(longPressTimer);
          }
        });
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
  
  function removeLink() {
    if (editor) {
      editor.commands.unsetLink();
      editor.commands.focus();
    }
    
    // Clean up state
    showLinkMenu = false;
    linkUrl = '';
    originalLinkUrl = '';
    isEditingLink = false;
    isHoveringLink = false;
    linkContextMenu = false;
  }
  
  function cancelLinkEdit() {
    if (editor) {
      // If we were creating a new link (empty href), remove it
      const { href } = editor.getAttributes('link');
      if (!href || href === '') {
        editor.commands.unsetLink();
      } else {
        // If we were editing an existing link, restore its original URL
        editor.commands.setLink({ href: originalLinkUrl });
      }
    }
    
    showLinkMenu = false;
    linkUrl = '';
    originalLinkUrl = '';
    isEditingLink = false;
    isHoveringLink = false;
    linkContextMenu = false;
    
    if (editor) {
      editor.commands.focus();
    }
  }
  
  function logout() {
    authActions.logout();
  }
  
  // Action to auto-focus input
  function focusInput(node) {
    // Immediate focus attempt
    if (node && node.offsetParent !== null) {
      node.focus();
      node.select();
    }
    
    // Small delay to ensure the element is rendered and visible
    setTimeout(() => {
      if (node && node.offsetParent !== null) { // Check if element is visible
        node.focus();
        node.select();
      }
    }, 10);
    
    return {
      update() {
        // Re-focus when the node updates
        if (node && node.offsetParent !== null) {
          node.focus();
          node.select();
        }
        setTimeout(() => {
          if (node && node.offsetParent !== null) {
            node.focus();
            node.select();
          }
        }, 10);
      }
    };
  }

  // Action to mount link menu content to the pre-created element
  function mountLinkMenu(node) {
    if (linkMenuElement) {
      linkMenuElement.appendChild(node);
    }
    
    return {
      destroy() {
        if (linkMenuElement && node.parentNode === linkMenuElement) {
          linkMenuElement.removeChild(node);
        }
      }
    };
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

<!-- Link Bubble Menu -->
<div use:mountLinkMenu class="link-bubble-menu">
  <!-- Single Pill for all states -->
  <div 
    class="bg-white/90 backdrop-blur-md shadow-lg rounded-full border border-gray-200 flex items-center divide-x divide-gray-200 transition-all duration-100" 
    style="height: 32px; width: {pillWidth}px;"
  >
    <!-- Remove/Cancel Button (left) -->
    <button
      on:click={() => {
        if (showLinkMenu) {
          cancelLinkEdit();
        } else {
          removeLink();
        }
      }}
      class="px-2 py-1 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors rounded-l-full h-full flex items-center flex-shrink-0"
      title={showLinkMenu ? "Cancel" : "Remove link"}
    >
      {#if showLinkMenu}
        <!-- X icon when canceling -->
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      {:else}
        <!-- Trash icon when removing -->
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      {/if}
    </button>
    
    <!-- Center: Link text or Input (grows with content) -->
    <div class="relative h-full flex items-center flex-grow min-w-0 overflow-hidden">
      {#if showLinkMenu}
        <!-- Input field when editing/creating -->
        <input
          type="url"
          bind:value={linkUrl}
          placeholder="https://example.com"
          class="w-full h-full px-3 text-sm bg-transparent border-none outline-none focus:ring-0 text-center resize-none"
          on:keydown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              applyLink();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              cancelLinkEdit();
            }
          }}
          on:input={() => {
            // Trigger width recalculation on input
            pillWidth = pillWidth;
          }}
          on:blur={() => {
            // Auto-normalize URL when user leaves the field (for visual feedback)
            if (linkUrl && linkUrl.trim()) {
              const normalized = normalizeUrl(linkUrl);
              if (normalized !== linkUrl) {
                linkUrl = normalized;
              }
            }
          }}
          use:focusInput
        />
      {:else}
        <!-- Link text display (clickable to edit) -->
        <button
          on:click={() => {
            // Blur TipTap editor to prevent keyboard conflicts
            if (editor?.view?.dom) {
              editor.view.dom.blur();
            }
            
            const href = editor.getAttributes('link').href || '';
            linkUrl = href;
            originalLinkUrl = href; // Store original URL
            isEditingLink = true;
            showLinkMenu = true;
          }}
          class="w-full h-full px-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-center relative overflow-hidden cursor-text"
          title="Click to edit link"
        >
          <div class="truncate">
            {#if editor}
              {#if showLinkMenu}
                <!-- When editing, show the linkUrl being edited -->
                {#if linkUrl}
                  {linkUrl}
                {:else}
                  <span class="text-gray-400 italic">New link</span>
                {/if}
              {:else}
                <!-- When hovering/viewing, show the current link URL from DOM -->
                {@const currentUrl = getCurrentLinkUrl()}
                {#if currentUrl}
                  {currentUrl}
                {:else}
                  <span class="text-gray-400 italic">New link</span>
                {/if}
              {/if}
            {/if}
          </div>
          <!-- Fade effect for long URLs -->
          <div class="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white/90 to-transparent pointer-events-none"></div>
        </button>
      {/if}
    </div>
    
    <!-- Open/Apply Button (right) -->
    {#if showLinkMenu}
      <!-- Checkmark when editing -->
      <button
        on:click={applyLink}
        disabled={!linkUrl || !linkUrl.trim()}
        class="px-2 py-1 text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors rounded-r-full h-full flex items-center disabled:text-gray-300 disabled:hover:bg-transparent flex-shrink-0"
        title="Apply link"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </button>
    {:else}
      <!-- Arrow to upper right when not editing -->
      <a
        href={editor ? editor.getAttributes('link').href : '#'}
        target="_blank"
        rel="noopener noreferrer"
        class="px-2 py-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-r-full h-full flex items-center flex-shrink-0"
        title="Open link"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 17L17 7M17 7H10M17 7V14"></path>
        </svg>
      </a>
    {/if}
  </div>
</div>

<!-- Remove the modal dialog entirely since we'll use the pill for everything -->
{#if false}
  <!-- This modal code is now disabled -->
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

  /* Force remove underlines from all links */
  :global(.ProseMirror a) {
    text-decoration: none !important;
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
