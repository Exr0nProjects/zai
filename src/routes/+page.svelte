<script>
  import { onMount, onDestroy } from 'svelte';
  import { Editor, Extension } from '@tiptap/core';
  import Document from '@tiptap/extension-document';
  import Text from '@tiptap/extension-text';
  import {
    ExtendedHeading,
    ExtendedParagraph,
    ExtendedBulletList,
    ExtendedTaskList,
    ExtendedListItem,
    ExtendedTaskItem,
    ExtendedBlockquote,
    ExtendedHorizontalRule,
    ExtendedOrderedList,
    ExtendedCodeBlock
  } from '$lib/tiptap/extendedNodes.js';
  import Bold from '@tiptap/extension-bold';
  import Italic from '@tiptap/extension-italic';
  import Code from '@tiptap/extension-code';
  import Strike from '@tiptap/extension-strike';
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
  import { BlockInfoDecorator } from '$lib/tiptap/BlockInfoDecorator.js';
  import { TimestampPlugin } from '$lib/tiptap/TimestampPlugin.js';
  import { MarkdownClipboard, serializeToMarkdown } from '$lib/tiptap/MarkdownClipboard.js';
  import { MarkdownPaste } from '$lib/tiptap/MarkdownPaste.js';
  import ListKeymap from '@tiptap/extension-list-keymap';
  import Link from '@tiptap/extension-link';
  import BubbleMenu from '@tiptap/extension-bubble-menu';
  import { getAllBlocks, sortBlocksByTimestamp, getBlockStats } from '$lib/utils/blockSorting.js';
  // import { TagMention } from '$lib/tiptap/TagMention.js';
  // import { TagParser } from '$lib/tiptap/TagParser.js';
  // import { InputRuleTagParser } from '$lib/tiptap/InputRuleTagParser.js';
  import { KeyboardNavigation } from '$lib/tiptap/KeyboardNavigationPlugin.js';
  import { HiddenBlocksPlugin } from '$lib/tiptap/HiddenBlocksPlugin.js';
  import { tagManager, isTagProcessing, tagStats } from '$lib/utils/tagManager.js';
  import { StreamingSearch } from '$lib/utils/streamingSearch.js';
  import { dev } from '$app/environment';
  import ZaiLogo from '$lib/components/ZaiLogo.svelte';
  import { searchHiddenBlocks } from '../lib/stores/searchHidden.js';
  import { SearchHighlightPlugin } from '../lib/tiptap/SearchHighlightPlugin.js';
  import { InlineParser, createParser, PARSERS } from '$lib/tiptap/InlineParser.js';
  import { PatternAnnotationPlugin } from '$lib/tiptap/PatternAnnotationPlugin.js';
  import { TimeGutterPlugin } from '$lib/tiptap/TimeGutterPlugin.js';
  
  // Debug flags (change these in code as needed)
  const debugNewBlocks = false; // Set to true to show blue borders on new blocks
  
  // Online/offline detection
  let isOnline = true;
  
  let searchQuery = '';
  let editor;
  let element;
  
  // Streaming search
  let streamingSearch = null;
  let searchProgress = { processed: 0, total: 0, matched: 0, completed: false };
  
  // Track when search is empty (has query but no matches)
  $: isSearchEmpty = searchQuery.trim().length > 0 && searchProgress.completed && searchProgress.matched === 0;
  
  // Simple timeline management
  let timelinePosition = null;
  
  // Mobile UI state
  let isSearchExpanded = false;
  let keyboardHeight = 0;
  
  // Hidden blocks debug state

  
  // Link management
  let linkMenuElement;
  let showLinkMenu = false;
  let linkUrl = '';
  let originalLinkUrl = ''; // Track original URL for cancel behavior
  let isEditingLink = false;
  let isHoveringLink = false; // Track if hovering over a link
  let linkContextMenu = false; // Track right-click/long-press
  let linkRefreshTrigger = 0; // Force reactivity when polling link state
  
  // Reactive current link URL that updates when trigger changes
  $: currentLinkUrl = linkRefreshTrigger >= 0 ? getCurrentLinkUrl() : '';
  
  // Reactive search - trigger immediately when query changes (real-time)
  $: if (searchQuery !== undefined) {
    handleSearch();
  }
  
  // Toggle hiding alternate blocks for testing


  // Get current link URL from DOM
  function getCurrentLinkUrl() {
    if (!editor) return '';
    
    try {
      // Get the current selection position
      const { from } = editor.state.selection;
      
      // Find the DOM node at this position
      const domAtPos = editor.view.domAtPos(from);
      
      // Walk up the DOM tree to find the link element
      let node = domAtPos.node;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
      }
      
      // Find the closest link element
      const linkElement = node?.closest('a[href]');
      
      if (linkElement) {
        return linkElement.getAttribute('href') || '';
      }
    } catch (error) {
      console.warn('Error getting current link URL:', error);
    }
    
    // Fallback to TipTap's method
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
  
  // Define focusSearchInput function early for keyboard shortcut
  function focusSearchInput() {
    // On mobile, expand search first if not already expanded
    if (window.innerWidth < 768 && !isSearchExpanded) { // md breakpoint
      isSearchExpanded = true;
      // Focus after expansion
      setTimeout(() => {
        const mobileInput = document.querySelector('.mobile-search-input');
        if (mobileInput) {
          mobileInput.focus();
          mobileInput.select();
        }
      }, 100);
    } else {
      // On desktop or when already expanded, focus the appropriate input
      const desktopInput = document.querySelector('input[placeholder="Search notes..."]:not(.mobile-search-input)');
      const mobileInput = document.querySelector('.mobile-search-input');
      
      const targetInput = mobileInput || desktopInput;
      if (targetInput) {
        targetInput.focus();
        targetInput.select();
      }
    }
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

  // Search keyboard shortcuts extension
  const SearchKeyboard = Extension.create({
    name: 'searchKeyboard',
    
    addKeyboardShortcuts() {
      return {
        'Mod-f': () => {
          // Focus the search input when Cmd+F is pressed
          focusSearchInput();
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
    // Include linkRefreshTrigger to force recalculation when link changes
    linkRefreshTrigger;
    
    if (showLinkMenu) {
      // When editing, base width on input placeholder or current value + extra padding
      const text = linkUrl || 'https://example.com';
      return Math.max(140, Math.min(450, text.length * 8 + 100)); // More padding: 140 min, 450 max, +100 padding
    } else {
      // When displaying, base width on current link URL + padding
      const text = currentLinkUrl || 'New link';
      return Math.max(120, Math.min(400, text.length * 8 + 80)); // Standard padding for display
    }
  })();
  
  onMount(() => {
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
        ExtendedCodeBlock,
        ExtendedBlockquote,
        ExtendedHorizontalRule,
        
        // Lists
        ExtendedOrderedList,
        ExtendedListItem,
        ListKeymap, // Provides Tab/Shift+Tab behavior for nested lists
        
        // UI
        Dropcursor,
        Gapcursor,
        
        // Link support
        CustomLink,
        
        // Search keyboard shortcuts
        SearchKeyboard,
        
        // Y.js Collaboration extension (replaces History)
        Collaboration.configure({
          document: ydoc,
        }),
        
        // Bubble menu for links
        BubbleMenu.configure({
          element: linkMenuElement,
          shouldShow: ({ editor }) => {
            // Show whenever cursor is inside a link (covers hover, editing, and cursor positioning)
            const isInLink = editor.isActive('link');
            
            if (isInLink) {
              // Explicitly update current link URL when we detect we're in a link
              currentLinkUrl = getCurrentLinkUrl();
            }
            
            return isInLink;
          },
          pluginKey: 'linkBubbleMenu',
          tippyOptions: {
            placement: 'top',
            offset: [0, 8],
            arrow: false,
            interactive: true,
            onShow: () => {
              // Re-poll active link state when bubble menu shows
              isHoveringLink = true;
              // Explicitly get and update current link URL
              currentLinkUrl = getCurrentLinkUrl();
              // Force reactivity update for pill width and content
              linkRefreshTrigger++;
            },
            onHide: () => {
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
        // TagMention, // Tag mentions with # trigger - disabled, using pattern highlighting instead
        // TagParser, // Auto-convert hashtags to tag mentions - disabled, using pattern highlighting instead  
        // InputRuleTagParser, // Convert hashtags on typing - disabled, using pattern highlighting instead
        KeyboardNavigation, // Remove tab index from irrelevant elements
        HiddenBlocksPlugin, // Enable hiding blocks with zero height and no interaction
        Placeholder.configure({
          placeholder: 'What do you think?',
        }),
        SearchHighlightPlugin,
        PatternAnnotationPlugin, // Hover annotations for patterns
        TimeGutterPlugin, // Time gutter on the left
        InlineParser.configure({
          enabled: true,
          debugMode: true, // Set to true for debugging
          parsers: PARSERS,
          throttleDelay: 100, // Process patterns every 100ms while typing
        }),
      ],
      // No initial content - Y.js will manage document state
    });

          // Set editor reference for search store and add debug functions to global scope
      import('../lib/stores/searchHidden.js').then(({ setEditorRef, debugSearchStore, debugEditorRef }) => {
        setEditorRef(editor);
        
        // Add debug functions to global scope for console access
        window.debugSearchStore = debugSearchStore;
        
        // Add pattern highlighting debug controls
        window.togglePatternHighlighting = () => {
          if (editor) {
            editor.commands.toggleParsing();
          }
        };
        
        window.highlightPatterns = () => {
          if (editor) {
            editor.commands.highlightPatterns();
            console.log('🎨 Manually highlighted patterns');
          }
        };
        
        window.clearPatterns = () => {
          if (editor) {
            editor.commands.clearPatterns();
            console.log('🧹 Cleared all pattern highlights');
          }
        };
        
        window.getParsingContext = () => {
          if (editor && window.getContext) {
            const context = window.getContext();
            console.log('📝 Current context:', context);
            return context;
          }
        };
        
        window.toggleChipConversion = () => {
          if (editor) {
            editor.commands.toggleChipConversion();
          }
        };
        window.debugEditorRef = debugEditorRef;
        
        // Debug new blocks is now a code-only flag (change const debugNewBlocks at top of file)
        
        // Add TipTap debug functions
        window.debugTipTapTree = () => {
          console.log('🌳 TipTap Document Tree:');
          console.log('  Document JSON:', editor.getJSON());
          
          console.log('\n📍 All blocks with blockId:');
          const blocks = [];
          editor.state.doc.descendants((node, pos) => {
            if (node.attrs && node.attrs.blockId) {
              blocks.push({
                blockId: node.attrs.blockId,
                type: node.type.name,
                pos: pos,
                content: node.textContent || '[empty]',
                attrs: node.attrs
              });
            }
          });
          blocks.forEach(block => {
            console.log(`  ${block.type}[${block.blockId}] @${block.pos}: "${block.content.substring(0, 30)}..."`);
          });
          return blocks;
        };
        
        // Add DOM debug functions  
        window.debugDOMClasses = () => {
          console.log('🏷️ DOM Elements with .hidden-block class:');
          const hiddenElements = document.querySelectorAll('.hidden-block');
          console.log(`  Found ${hiddenElements.length} elements with .hidden-block class`);
          
          hiddenElements.forEach((el, index) => {
            const blockId = el.getAttribute('data-block-id');
            const nodeType = el.tagName.toLowerCase();
            const content = el.textContent || '[empty]';
            console.log(`  ${index + 1}. ${nodeType}[${blockId}]: "${content.substring(0, 30)}..."`);
          });
          return hiddenElements;
        };
        
        window.debugDOMSearch = (blockId) => {
          console.log(`🔎 Searching DOM for blockId: ${blockId}`);
          const elements = document.querySelectorAll(`[data-block-id="${blockId}"]`);
          console.log(`  Found ${elements.length} elements with this blockId:`);
          
          elements.forEach((el, index) => {
            console.log(`  ${index + 1}. ${el.tagName.toLowerCase()}`);
            console.log(`    Classes: ${el.className}`);
            console.log(`    Has .hidden-block: ${el.classList.contains('hidden-block')}`);
            console.log(`    Content: "${el.textContent.substring(0, 50)}..."`);
          });
          return elements;
        };
        
        // Test functions for manual hiding
        window.testHideBlock = async (blockId) => {
          const { hideBlockInSearch } = await import('../lib/stores/searchHidden.js');
          console.log(`🙈 Manually hiding block: ${blockId}`);
          hideBlockInSearch(blockId);
          
          // Check results
          setTimeout(() => {
            console.log('After hiding:');
            window.debugSearchStore();
            window.debugDOMSearch(blockId);
          }, 100);
        };
        
        window.testClearHiding = async () => {
          const { clearSearchHiding } = await import('../lib/stores/searchHidden.js');
          console.log('👁️ Clearing all hiding');
          clearSearchHiding();
          
          setTimeout(() => {
            console.log('After clearing:');
            window.debugSearchStore();
            window.debugDOMClasses();
          }, 100);
        };
        
        // Check decorations
        window.debugDecorations = () => {
          console.log('🎨 Current Editor Decorations:');
          if (editor.view && editor.view.decorations) {
            console.log('  Decorations exist:', !!editor.view.decorations);
            console.log('  Decorations object:', editor.view.decorations);
          } else {
            console.log('  No decorations found');
          }
          return editor.view?.decorations;
        };
        
        // Debug hierarchy
        window.debugHierarchy = () => {
          console.log('🌳 Block Hierarchy:');
          const allBlocks = [];
          editor.state.doc.descendants((node, pos) => {
            if (node.attrs && node.attrs.blockId) {
              allBlocks.push({
                blockId: node.attrs.blockId,
                nodeType: node.type.name,
                parentId: node.attrs.parentId,
                content: (node.textContent || '[empty]').substring(0, 30) + '...',
                pos: pos
              });
            }
          });
          
          // Use streamingSearch to build hierarchy if available
          if (streamingSearch) {
            const hierarchy = streamingSearch.buildHierarchy(allBlocks);
            console.log('Built hierarchy:', hierarchy);
            
            const printNode = (node, indent = '') => {
              console.log(indent + `${node.block.nodeType}[${node.block.blockId}]: "${node.block.content || ''}"`);
              if (node.children && node.children.length > 0) {
                node.children.forEach(child => printNode(child, indent + '  '));
              }
            };
            
            hierarchy.forEach(rootNode => printNode(rootNode));
            return hierarchy;
          } else {
            console.log('Raw blocks (streamingSearch not available):', allBlocks);
            return allBlocks;
          }
        };
      });

      // Initialize streaming search immediately after editor creation
      streamingSearch = new StreamingSearch(editor);

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
            // Only scroll to end if document has meaningful content
            if (hasNonEmptyContent()) {
              focusAtEnd();
            }
          }, 50);
        }, 50);
      }
    });
    
    // Extract tags periodically
    if (editor) {
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
      
      // Update title on editor changes
      editor.on('update', () => {
        updateDocumentTitle();
        // Debounce tag extraction to avoid excessive processing
        clearTimeout(window.tagExtractionTimeout);
        window.tagExtractionTimeout = setTimeout(extractTags, 2000);
      });
      
      // Update title on cursor movement
      editor.on('selectionUpdate', () => {
        updateDocumentTitle();
      });
      
      // Initial tag extraction and title update
      setTimeout(() => {
        extractTags();
        updateDocumentTitle();
      }, 1000);
      
      return () => {
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
    
    // Cleanup streaming search
    if (streamingSearch) {
      streamingSearch.destroy();
    }
    
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
    
    // Block sorting complete
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
  
  function updateDocumentTitle() {
    if (!editor) return;
    
    try {
      const { doc, selection } = editor.state;
      const cursorPos = selection.from;
      
      // Find the first non-empty line in the current section
      const firstLineText = findCurrentSectionFirstLine(doc, cursorPos);
      
      if (firstLineText) {
        // Truncate to reasonable length for title
        const truncated = firstLineText.length > 50 ? firstLineText.slice(0, 50) + '...' : firstLineText;
        document.title = `zai - ${truncated}`;
      } else {
        document.title = 'zai';
      }
    } catch (error) {
      console.warn('Failed to update document title:', error);
      document.title = 'zai';
    }
  }
  
  function findCurrentSectionFirstLine(doc, cursorPos) {
    // Efficient approach: start from cursor position and work backwards
    let nodePositions = [];
    
    // Build node position map
    let pos = 0;
    doc.content.forEach((node, index) => {
      nodePositions.push({ node, pos, index });
      pos += node.nodeSize;
    });
    
    
    if (nodePositions.length === 0) return null;
    
    // Find current node (binary search would be even better for huge docs)
    let currentNodeIndex = nodePositions.length - 1;
    for (let i = 0; i < nodePositions.length; i++) {
      const next = nodePositions[i + 1];
      if (nodePositions[i].pos <= cursorPos && (!next || next.pos > cursorPos)) {
        currentNodeIndex = i;
        break;
      }
    }
    
    
    // Check if cursor is on an empty line - if so, start from the line above
    let startIndex = currentNodeIndex;
    const currentNodeData = nodePositions[currentNodeIndex];
    const currentText = serializeToMarkdown([currentNodeData.node]).trim();
    const currentIsEmpty = currentText === '';
    
    if (currentIsEmpty) {
      startIndex = currentNodeIndex - 1;
    }
    
    // Work backwards from start position to find section boundary
    let emptyCount = 0;
    let foundSectionBoundary = false;
    let actualSectionStartIndex = null;
    
    for (let i = startIndex; i >= 0; i--) {
      const nodeData = nodePositions[i];
      const text = serializeToMarkdown([nodeData.node]).trim();
      const isEmpty = text === '';
      
      
      if (isEmpty) {
        emptyCount++;
      } else {
        // Found non-empty node
        if (emptyCount >= 2) {
          // We found 2+ empty lines above this non-empty node (end of previous section)
          foundSectionBoundary = true;
          
          // Now go forward to find the actual start of current section (after the empty lines)
          for (let j = i + 1; j <= currentNodeIndex; j++) {
            const nextNodeData = nodePositions[j];
            const nextText = serializeToMarkdown([nextNodeData.node]).trim();
            
            if (nextText !== '') {
              actualSectionStartIndex = j;
              break;
            }
          }
          break;
        }
        emptyCount = 0; // Reset count
      }
    }
    
    // If no section with 2+ empty lines above, don't show title
    if (!foundSectionBoundary || actualSectionStartIndex === null) {
      return null;
    }
    
    // Return the first line of the current section
    const nodeData = nodePositions[actualSectionStartIndex];
    const text = serializeToMarkdown([nodeData.node]).trim();
    return text;
  }
  
  // Check if document has meaningful content (not just empty paragraphs)
  function hasNonEmptyContent() {
    if (!editor) return false;
    
    const { doc } = editor.state;
    let hasContent = false;
    
    doc.descendants((node) => {
      // Check for any non-empty text content
      if (node.textContent && node.textContent.trim().length > 0) {
        hasContent = true;
        return false; // Stop searching
      }
      // Check for timeline marks or other meaningful content
      if (node.marks && node.marks.some(mark => mark.type.name === 'timeline')) {
        hasContent = true;
        return false; // Stop searching
      }
    });
    
    return hasContent;
  }
  
  async function handleSearch() {
    if (!streamingSearch || !editor) {
      // console.warn('❌ Missing dependencies - streamingSearch:', !!streamingSearch, 'editor:', !!editor);
      return;
    }
    
    const query = searchQuery.trim();
    
    if (query === '') {
      // Empty query - clear search and show all blocks
      streamingSearch.clearSearch();
      searchProgress = { processed: 0, total: 0, matched: 0, completed: true };
      return;
    }
    
    // Start streaming search
    searchProgress = { processed: 0, total: 0, matched: 0, completed: false };
    
    await streamingSearch.streamSearch(query, (progress) => {
      searchProgress = progress;
    });
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
        
        // Position at 1/3 viewport height instead of center
        const targetScroll = contentHeight - (viewportHeight / 3);
        
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
      if (isEditingLink) {
        // Editing existing link: restore original URL and go back to display state
        if (originalLinkUrl) {
          editor.commands.setLink({ href: originalLinkUrl });
        }
        // Don't hide the bubble menu, just exit edit mode
        showLinkMenu = false;
        linkUrl = '';
        originalLinkUrl = '';
        isEditingLink = false;
        // Keep isHoveringLink = true so bubble menu stays visible
      } else {
        // Creating new link: delete the empty link entirely
        const { href } = editor.getAttributes('link');
        if (!href || href === '') {
          editor.commands.unsetLink();
        }
        // Hide bubble menu completely for new link cancellation
        showLinkMenu = false;
        linkUrl = '';
        originalLinkUrl = '';
        isEditingLink = false;
        isHoveringLink = false;
        linkContextMenu = false;
      }
    }
    
    // Always refocus editor
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

  // Set debug flag on global window object for TimestampPlugin
  $: if (typeof window !== 'undefined') {
    window.debugNewBlocks = debugNewBlocks;
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
    
    <!-- Right: Tag processing indicator, Debug button and zai with online indicator -->
    <div class="flex items-center space-x-2 pointer-events-auto">
      <!-- Tag Processing Indicator -->
      {#if $isTagProcessing}
        <div class="bg-blue-50/90 backdrop-blur-md shadow-lg rounded-full px-3 py-1.5 border border-blue-200/50 animate-pulse"
             title="Processing tags...">
          <div class="text-xs text-blue-600 font-medium">🏷️ processing</div>
        </div>
      {/if}
      
      <!-- Zai with online indicator -->
      <div class="opacity-10 hover:opacity-100 transition-opacity duration-200">
        <div class="bg-white/90 backdrop-blur-md shadow-lg rounded-full px-4 py-2 flex items-center space-x-2 border border-gray-200/50">
          <ZaiLogo size="sm" color="text-gray-600" />
          <div 
            class="w-1.5 h-1.5 rounded-full {isOnline ? 'bg-green-500' : 'bg-gray-300'} transition-colors duration-200"
            title={isOnline ? 'Online' : 'Offline'}
          ></div>
        </div>
      </div>
    </div>
  </div>
</div>

{#if dev}
  <div class="fixed top-4 right-4 z-50 bg-accent-light text-white px-2 py-1 rounded text-xs font-mono pointer-events-none">
    throttled-keystroke-parsing
  </div>
{/if}

<!-- Editor with internal spacing -->
<div class="bg-white editor-container">
  <div 
    bind:this={element}
    class="prose max-w-prose mx-auto focus-within:outline-none px-8"
    tabindex="0"
  />
</div>

<!-- Empty search placeholder -->
{#if isSearchEmpty}
  <div class="max-w-prose mx-auto px-8" style="margin-top: -80vh;">
    <div class="empty-search-placeholder">
      nothin. search again?
    </div>
  </div>
{/if}

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
          <div class="bg-white/90 backdrop-blur-md shadow-lg rounded-full border border-gray-200 flex items-center divide-x divide-gray-200" style="height: 48px;">
            <input
              type="text"
              bind:value={searchQuery}
              placeholder={isSearchExpanded ? "save" : "search"}
              class="w-32 h-full px-3 text-sm bg-transparent border-none outline-none focus:ring-0 text-center rounded-l-full"
              on:keypress={(e) => e.key === 'Enter' && handleSearch()}
              on:focus={() => {/* placeholder will show 'save' when expanded */}}
              on:blur={() => isSearchExpanded = false}
            />
            <button
              on:click={handleSearch}
              class="px-3 h-full filter-save-button flex items-center rounded-r-full"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
              </svg>
            </button>
          </div>
          {#if searchQuery && !searchProgress.completed && searchProgress.total > 0}
            <div class="absolute bottom-[-20px] right-0 text-xs text-gray-500">
              {searchProgress.matched} matches ({Math.round((searchProgress.processed / searchProgress.total) * 100)}%)
            </div>
          {/if}
        </div>
        
        <button
          on:click={toggleSearchExpanded}
          class="mobile-cancel-button rounded-full p-3"
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
          <div class="hidden w-full md:flex justify-center">
            <div class="bg-white/90 w-full backdrop-blur-md shadow-lg rounded-full border border-[var(--border)] flex items-center divide-x divide-[var(--border)]" style="height: 40px;">
              <input
                type="text"
                bind:value={searchQuery}
                placeholder="filter"
                tabindex="-1"
                class="w-24 h-full px-3 text-sm bg-transparent border-none outline-none focus:ring-0 flex-grow text-center rounded-l-full"
                on:keypress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                on:click={handleSearch}
                class="px-3 h-full filter-save-button rounded-r-full flex items-center"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                </svg>
              </button>
            </div>
          </div>
          {#if searchQuery && !searchProgress.completed && searchProgress.total > 0}
            <div class="hidden md:block absolute bottom-[-18px] right-0 text-xs text-gray-500">
              {searchProgress.matched} matches ({Math.round((searchProgress.processed / searchProgress.total) * 100)}%)
            </div>
          {/if}
          
          <!-- Mobile Search Button -->
          <button
            on:click={toggleSearchExpanded}
            tabindex="-1"
            class="md:hidden mobile-search-button rounded-full p-3"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </button>
        </div>
        
        <!-- Tool Bar (Long Pill) -->
        <div class="toolbar-pill flex items-center divide-x divide-[var(--border)]">
          <!-- Indent -->
          <button
            on:click={indentList}
            tabindex="-1"
            class="px-3 py-3 md:py-2 toolbar-button rounded-l-full"
            title="Indent"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18 6-6-6-6"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 18 6-6-6-6"/>
            </svg>
          </button>
          
          <!-- Outdent -->
          <button
            on:click={outdentList}
            tabindex="-1"
            class="px-3 py-3 md:py-2 toolbar-button"
            title="Outdent"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 18-6-6 6-6"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18-6-6 6-6"/>
            </svg>
          </button>
          
          <!-- Todo List -->
          <button
            on:click={addTodoList}
            tabindex="-1"
            class="px-3 py-3 md:py-2 toolbar-button"
            title="Add Todo List"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 12 2 2 4-4"/>
            </svg>
          </button>
          
          <!-- Link -->
          <button
            on:click={addLink}
            tabindex="-1"
            class="px-3 py-3 md:py-2 toolbar-button rounded-r-full"
            title="Add Link"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 512 512">
              <path d="M49.1,255.6c0-43.8,35.9-78.9,78.9-78.9h102.6v-48.2H128c-71,0-128,57-128,128c0,70.1,57,128,128,128h102.6v-50H128C84.2,334.5,49.1,299.4,49.1,255.6z M153.4,281h204.3v-50.8H153.4V281z M384,127.6H281.4v49.1H384c43.8,0,78.9,35.9,78.9,78.9S427,334.5,384,334.5H281.4v48.2H384c70.1,0,128-57,128-128C512,184.5,454.1,127.6,384,127.6z"/>
            </svg>
          </button>
        </div>
        
        <!-- Jump to End Button -->
        <button
          on:click={focusAtEnd}
          tabindex="-1"
          class="jump-to-present-btn backdrop-blur-md text-white rounded-full p-3 transition-colors shadow-lg click:transform-scale-105"
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
                {@const currentUrl = currentLinkUrl}
                {@const _ = linkRefreshTrigger} <!-- Force reactivity -->
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
    padding: 30vh 1rem calc(100vh - 4rem) 1rem;
    line-height: 1.25;
    height: 100%;
    font-family: var(--editor-font), sans-serif;
    font-size: var(--editor-font-size);
    font-weight: var(--editor-font-weight);
  }

  /* Force remove underlines from all links */
  :global(.ProseMirror a) {
    text-decoration: none !important;
  }

  /* Hidden blocks that are NOT the first in a contiguous sequence */
  /* These get completely collapsed */
  :global(.hidden-block + .hidden-block) {
    height: 0 !important;
    overflow: hidden !important;
    margin: 0 !important;
    padding: 0 !important;
    pointer-events: none !important;
    user-select: none !important;
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    line-height: 0 !important;
    display: none !important;
  }

  /* First hidden block in a sequence - minimal height to show separator */
  /* BUT only if not nested inside another hidden block */
  :global(.hidden-block:not(.hidden-block + .hidden-block):not(.hidden-block .hidden-block)) {
    height: 5px !important;
    overflow: hidden !important;
    margin: 0 !important;
    padding: 0 !important;
    pointer-events: none !important;
    user-select: none !important;
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    opacity: 1 !important; /* Keep visible for pseudo-element */
    line-height: 0 !important;
    position: relative;
    /* Remove list decorations */
    list-style: none !important;
  }

  /* Hidden blocks that are nested inside other hidden blocks - fully collapse */
  :global(.hidden-block .hidden-block) {
    height: 0 !important;
    overflow: hidden !important;
    margin: 0 !important;
    padding: 0 !important;
    pointer-events: none !important;
    user-select: none !important;
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    line-height: 0 !important;
    display: none !important;
    list-style: none !important;
  }

  /* Hide content inside first hidden blocks (but keep the block visible for pseudo-element) */
  :global(.hidden-block:not(.hidden-block + .hidden-block) *) {
    height: 0 !important;
    overflow: hidden !important;
    margin: 0 !important;
    padding: 0 !important;
    pointer-events: none !important;
    user-select: none !important;
    -webkit-user-select: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    line-height: 0 !important;
    display: none !important;
  }

  /* Remove decorations from hidden blocks */
  :global(.hidden-block) {
    list-style: none !important;
  }

  /* Hide checkboxes and labels in hidden task items */
  :global(.hidden-block label) {
    display: none !important;
  }
  
  /* Hide bullets, numbers, and other list markers */
  :global(.hidden-block::marker) {
    display: none !important;
  }

  /* Remove margins that would be left by list items */
  :global(ul .hidden-block, ol .hidden-block) {
    margin-left: 0 !important;
    padding-left: 0 !important;
  }

  /* Double-line separator for first hidden block in any sequence */
  :global(.hidden-block:not(.hidden-block + .hidden-block):not(.hidden-block .hidden-block)::before) {
    content: '';
    display: block;
    width: 100%;
    height: 5px;
    background: 
      linear-gradient(to right, transparent 0%, #cbd5e1 20%, #cbd5e1 80%, transparent 100%),
      linear-gradient(to right, transparent 0%, #cbd5e1 20%, #cbd5e1 80%, transparent 100%);
    background-size: 100% 1px;
    background-position: 0 1px, 0 3px;
    background-repeat: no-repeat;
    margin: 0;
    opacity: 0.6;
    pointer-events: none;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
  }

  /* Highlight the center-tracked block during search */
  :global(.search-center-block) {
    border: 1px solid #3b82f6 !important;
    border-radius: 4px;
    position: relative;
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

  /* Manual hover highlighting with debug-hovered class */
  :global(.block-with-info.debug-hovered) {
    background-color: var(--block-hover-bg);
    border: 2px solid #f97316 !important; 
    border-radius: 0.375rem;
  }

  /* Parent block highlighting with orange 1px border */
  :global(.block-with-info.parent-highlighted) {
    border: 4px dashed #f97316; /* Orange 1px border for parent */
    border-radius: 0.375rem;
  }

  /* Block info tooltip styling */
  :global(.block-info-tooltip) {
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-family: 'Barlow', sans-serif;
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
    align-items: baseline;
    border: var(--debug-borders);
  }
  
  :global(.ProseMirror ul[data-type="taskList"] li > label > input[type="checkbox"]) {
    appearance: none;
    -webkit-appearance: none;
    width: 1rem;
    height: 1rem;
    border-radius: 50%; /* Make circular */
    transform: translateY(0.25em);
    border: 1px solid var(--border);
    margin: 0;
    cursor: pointer;
    background-color: var(--bg);
    position: relative;
    transition: all 0.2s ease;
  }
  
  :global(.ProseMirror ul[data-type="taskList"] li > label > input[type="checkbox"]:checked) {
    background-color: var(--accent);
    border-color: var(--accent);
  }
  
  :global(.ProseMirror ul[data-type="taskList"] li > label > input[type="checkbox"]:checked::after) {
    content: '✓';
    font-family: 'Courier New', monospace;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -43%);
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
  
  /* Horizontal line after 2nd empty paragraph in sequences of 2+ empty paragraphs */
  :global(.ProseMirror > p:not(:has(> br.ProseMirror-trailingBreak:only-child)) + 
         p:has(> br.ProseMirror-trailingBreak:only-child) + 
         p:has(> br.ProseMirror-trailingBreak:only-child)::after,
         .ProseMirror > p:first-child:has(> br.ProseMirror-trailingBreak:only-child) + 
         p:has(> br.ProseMirror-trailingBreak:only-child)::after) {
    content: '';
    display: block;
    width: 100%;
    height: 1px;
    background: #e5e7eb;
    margin-top: 1rem;
    margin-bottom: 0rem;
    pointer-events: none;
  }
  
  /* Add padding to empty paragraphs that get the line */
  :global(.ProseMirror > p:not(:has(> br.ProseMirror-trailingBreak:only-child)) + 
         p:has(> br.ProseMirror-trailingBreak:only-child) + 
         p:has(> br.ProseMirror-trailingBreak:only-child),
         .ProseMirror > p:first-child:has(> br.ProseMirror-trailingBreak:only-child) + 
         p:has(> br.ProseMirror-trailingBreak:only-child)) {
    padding-top: 1rem;
    padding-bottom: 0rem;
  }
  
  /* Select element immediately after two empty paragraphs (after the hline) */
  :global(.ProseMirror > p:not(:has(> br.ProseMirror-trailingBreak:only-child)) + 
         p:has(> br.ProseMirror-trailingBreak:only-child) + 
         p:has(> br.ProseMirror-trailingBreak:only-child) + *,
         .ProseMirror > p:first-child:has(> br.ProseMirror-trailingBreak:only-child) + 
         p:has(> br.ProseMirror-trailingBreak:only-child) + *) {
    padding-top: 2.7rem;
  }
</style>


