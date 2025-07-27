<script>
  import { onMount, onDestroy } from 'svelte';
            import { Editor } from '@tiptap/core';
          import StarterKit from '@tiptap/starter-kit';
          import Placeholder from '@tiptap/extension-placeholder';
          import { user, authActions } from '$lib/stores/auth.js';
          import { checkOnlineStatus } from '$lib/utils/auth.js';
          import { notes, notesActions, isLoading } from '$lib/stores/notes.js';
          import { TimelineMark } from '$lib/tiptap/TimelineMark.js';
          import { CustomParagraph } from '$lib/tiptap/CustomParagraph.js';
          import { CustomHeading } from '$lib/tiptap/CustomHeading.js';
  
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
                StarterKit.configure({
                  // Disable default paragraph and heading to use our custom ones
                  paragraph: false,
                  heading: false,
                }),
                CustomParagraph,
                CustomHeading,
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
          const { selection } = view.state;
          const currentPos = selection.from;
          
          // Prevent editing of lines before the timeline
          if (isBeforeTimeline(currentPos)) {
            // Allow only navigation keys
            const allowedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'];
            if (!allowedKeys.includes(event.key)) {
              event.preventDefault();
              return true;
            }
          }
          
                            // Handle Enter key to save current line
                  if (event.key === 'Enter' && !event.shiftKey) {
                    // Get current line content with formatting
                    const doc = view.state.doc;
                    const resolvedPos = doc.resolve(currentPos);
                    const currentParagraph = resolvedPos.parent;

                    if (currentParagraph && currentParagraph.textContent.trim()) {
                      // Get the markdown representation of the paragraph
                      let markdownContent = '';
                      currentParagraph.forEach((node, offset) => {
                        if (node.isText) {
                          let text = node.text;
                          // Apply markdown formatting based on marks
                          if (node.marks) {
                            node.marks.forEach(mark => {
                              switch (mark.type.name) {
                                case 'strong':
                                  text = `**${text}**`;
                                  break;
                                case 'em':
                                  text = `*${text}*`;
                                  break;
                                case 'code':
                                  text = `\`${text}\``;
                                  break;
                              }
                            });
                          }
                          markdownContent += text;
                        }
                      });

                      // Check if this is a heading
                      if (currentParagraph.type.name === 'heading') {
                        const level = currentParagraph.attrs.level || 1;
                        markdownContent = '#'.repeat(level) + ' ' + markdownContent;
                      }

                      // Save the current line with markdown formatting
                      notesActions.saveNote(markdownContent, new Date());
                      
                      // Prevent default Enter behavior since we're handling the save manually
                      // The content rebuild will create the appropriate new paragraph
                      return true;
                    }

                    // If empty line, allow normal Enter behavior
                    return false;
                  }
          return false;
        }
      }
    });

                // Watch for notes changes and update editor
            let isFirstLoad = true;
            const unsubscribe = notes.subscribe((currentNotes) => {
              if (editor && !$isLoading) {
                const newContent = notesActions.buildTimelineDocument(currentNotes);
                const currentContent = editor.getJSON();

                // Only update if content actually changed to avoid cursor jumps
                if (JSON.stringify(newContent) !== JSON.stringify(currentContent)) {
                  editor.commands.setContent(newContent);
                  
                  // Only auto-jump on first page load, not on every content update
                  if (isFirstLoad) {
                    isFirstLoad = false;
                    setTimeout(() => {
                      focusAtTimeline();
                    }, 200);
                  }
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
              // Find the timeline mark position
              const { doc } = editor.state;
              let timelineNodePos = null;

              doc.descendants((node, pos) => {
                if (node.marks?.some(mark => mark.type.name === 'timeline')) {
                  timelineNodePos = pos;
                  return false; // Stop searching
                }
              });

              if (timelineNodePos !== null) {
                // Find the position after the timeline to focus there
                const tr = editor.state.tr;
                const insertPos = timelineNodePos + 1;
                
                // Focus at the position after timeline
                setTimeout(() => {
                  editor.commands.focus();
                  editor.commands.setTextSelection(insertPos);
                  scrollToTimelineCenter();
                }, 50);
              } else {
                // If no timeline found (hidden due to 2-minute rule), focus at end of document
                const endPos = doc.content.size - 1;
                
                // Add 2 empty lines at the end for writing
                const tr = editor.state.tr;
                tr.insert(endPos, editor.schema.nodes.paragraph.create({ class: 'future-content' }));
                tr.insert(endPos + 1, editor.schema.nodes.paragraph.create({ class: 'future-content' }));
                editor.view.dispatch(tr);
                
                setTimeout(() => {
                  editor.commands.focus();
                  editor.commands.setTextSelection(endPos);
                }, 50);
              }
            }
          }

            function scrollToTimelineCenter() {
            if (editor) {
              // Find the timeline element in the DOM
              const timelineElement = editor.view.dom.querySelector('span[data-timeline]');
              
              if (timelineElement) {
                // Scroll to center the timeline properly
                timelineElement.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center',
                  inline: 'nearest'
                });
              }
            }
          }

  function isAtTimeline(pos) {
    if (!editor) return false;
    const { doc } = editor.state;
    const resolvedPos = doc.resolve(pos);
    return resolvedPos.parent.marks?.some(mark => mark.type.name === 'timeline') || false;
  }

  function isBeforeTimeline(pos) {
    if (!editor) return false;
    const { doc } = editor.state;
    let timelinePos = null;
    
    doc.descendants((node, nodePos) => {
      if (node.marks?.some(mark => mark.type.name === 'timeline')) {
        timelinePos = nodePos;
        return false;
      }
    });
    
    return timelinePos !== null && pos < timelinePos;
  }
  
  function logout() {
    authActions.logout();
  }
</script>

        <!-- Top Bar - Floating Tags -->
        <div 
          class="fixed top-4 left-4 right-4 z-50 transition-opacity duration-300 {topBarHovered ? 'opacity-100' : 'opacity-20'}"
          on:mouseenter={() => topBarHovered = true}
          on:mouseleave={() => topBarHovered = false}
        >
          <div class="flex items-center justify-between">
            <!-- Left floating tags -->
            <div class="flex items-center space-x-2">
              <div class="bg-white/90 backdrop-blur-sm shadow-sm rounded-full px-3 py-1.5 text-sm font-medium text-gray-900">
                {$user?.phone || $user?.email || 'Loading...'}
              </div>
              <button 
                on:click={logout}
                class="bg-white/90 backdrop-blur-sm shadow-sm rounded-full px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
            
            <!-- Right floating tag -->
            <div class="bg-white/90 backdrop-blur-sm shadow-sm rounded-full px-3 py-1.5 flex items-center space-x-2">
              <div class="w-2 h-2 rounded-full {isOnline ? 'bg-green-500' : 'bg-red-500'}"></div>
              <span class="text-sm text-gray-600">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

                <!-- Main Editor Area -->
        <div class="pt-20 pb-24 min-h-screen bg-white">
          <div class="max-w-4xl mx-auto px-4 py-8" style="padding-bottom: 50vh;">
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
                style="padding-bottom: 50vh;"
              />
    {/if}
  </div>
</div>

        <!-- Bottom Bar - Floating Buttons -->
        <div class="fixed bottom-4 left-4 right-4 z-50">
          <div class="flex items-center justify-center space-x-4">
            <!-- Search Button -->
            <div class="flex-1 max-w-md relative">
              <input
                type="text"
                bind:value={searchQuery}
                placeholder="Search notes..."
                class="w-full bg-white/90 backdrop-blur-sm shadow-lg rounded-full pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                on:keypress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                on:click={handleSearch}
                class="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-blue-600 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </button>
            </div>
            
            <!-- Jump to Now Button -->
            <button
              on:click={focusAtTimeline}
              class="bg-blue-600 text-white rounded-full px-6 py-3 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center space-x-2 shadow-lg"
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
            padding: 1rem 1rem 1rem 4rem; /* Left padding for timestamp gutter */
            line-height: 1.8;
            position: relative;
            font-family: 'Lora', serif; /* Use Lora specifically for the editor content */
          }
          
          :global(.ProseMirror p.is-editor-empty:first-child::before) {
            content: attr(data-placeholder);
            float: left;
            color: #adb5bd;
            pointer-events: none;
            height: 0;
          }
          
          
          :global(.ProseMirror .timeline-marker::before) {
            content: '→';
            position: absolute;
            left: 0.5rem;
            top: 50%;
            transform: translateY(-50%);
            font-size: 0.75rem;
            color: rgba(156, 163, 175, 0.8);
            font-family: ui-monospace, 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Courier New', monospace;
            width: 3rem;
            text-align: right;
            pointer-events: none;
            z-index: 1000;
          }
          
          :global(.ProseMirror .timeline-now) {
            margin: 1rem 0;
          }
          
          :global(.ProseMirror .future-content) {
            opacity: 0.6; /* Dim future content */
          }
          
          /* Timestamp gutter - now using proper data attributes */
          :global(.ProseMirror p[data-timestamp]::before),
          :global(.ProseMirror h1[data-timestamp]::before),
          :global(.ProseMirror h2[data-timestamp]::before),
          :global(.ProseMirror h3[data-timestamp]::before),
          :global(.ProseMirror h4[data-timestamp]::before),
          :global(.ProseMirror h5[data-timestamp]::before),
          :global(.ProseMirror h6[data-timestamp]::before) {
            content: attr(data-timestamp);
            position: absolute;
            left: 0.5rem;
            font-size: 0.75rem;
            color: rgba(156, 163, 175, 0.8); /* Subtle gray color */
            font-family: ui-monospace, 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Courier New', monospace;
            width: 3rem;
            text-align: right;
            pointer-events: none;
            line-height: inherit;
            z-index: 1000;
          }
          
          /* Heading styles */
          :global(.ProseMirror h1) {
            font-size: 1.875rem;
            font-weight: 600;
            margin: 0.5rem 0;
            line-height: 1.2;
          }
          
          :global(.ProseMirror h2) {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 0.5rem 0;
            line-height: 1.3;
          }
          
          :global(.ProseMirror h3) {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 0.375rem 0;
            line-height: 1.4;
          }
          
          :global(.ProseMirror h4) {
            font-size: 1.125rem;
            font-weight: 500;
            margin: 0.25rem 0;
            line-height: 1.5;
          }
          
          :global(.ProseMirror h5) {
            font-size: 1rem;
            font-weight: 500;
            margin: 0.25rem 0;
            line-height: 1.5;
          }
          
          :global(.ProseMirror h6) {
            font-size: 0.875rem;
            font-weight: 500;
            margin: 0.25rem 0;
            line-height: 1.5;
          }
          
          /* Inline formatting styles */
          :global(.ProseMirror strong) {
            font-weight: 600;
          }
          
          :global(.ProseMirror em) {
            font-style: italic;
          }
          
          :global(.ProseMirror code) {
            background-color: rgba(0, 0, 0, 0.05);
            padding: 0.125rem 0.25rem;
            border-radius: 0.25rem;
            font-family: ui-monospace, 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Courier New', monospace;
            font-size: 0.875em;
          }
          

          
          /* Read-only styling for past content */
          :global(.ProseMirror-readonly) {
            opacity: 0.7;
            background-color: rgba(0, 0, 0, 0.02);
            cursor: default;
          }
          
          /* Highlight that editing is disabled */
          :global(.ProseMirror [noteId]:not(.timeline-marker)) {
            border-left: 2px solid rgba(0, 0, 0, 0.05);
            padding-left: 0.5rem;
            margin-left: -0.5rem;
          }
        </style>
