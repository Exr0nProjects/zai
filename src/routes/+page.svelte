<script>
  import { onMount, onDestroy } from 'svelte';
  import { user, authActions } from '$lib/stores/auth.js';
  import { checkOnlineStatus } from '$lib/utils/auth.js';
  import { notes, notesActions, isLoading } from '$lib/stores/notes.js';
  
  let isOnline = true;
  let topBarHovered = false;
  let searchQuery = '';
  let timelineContainer;
  let nowMarker;
  
  // Timeline data
  let pastNotes = [];
  let futureNotes = [];
  let nowIndex = 0;
  
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
  });

  // Watch for notes changes and update timeline data
  $: if ($notes) {
    const timelineData = notesActions.getSortedNotesWithNowPosition($notes);
    pastNotes = timelineData.pastNotes;
    futureNotes = timelineData.futureNotes;
    nowIndex = timelineData.nowIndex;
  }
  
  function handleSearch() {
    if (searchQuery.trim()) {
      // TODO: Implement search within editor content
      console.log('Searching for:', searchQuery);
    }
  }
  
  function jumpToNow() {
    if (nowMarker) {
      nowMarker.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function handleBlockEdit(event, note = null) {
    const element = event.target;
    element.contentEditable = true;
    element.focus();
    
    // Add visual editing state
    element.classList.add('editing');
  }

  function handleBlockSave(event, note = null) {
    const element = event.target;
    const content = element.textContent.trim();
    
    element.contentEditable = false;
    element.classList.remove('editing');
    
    if (content && content !== note?.contents) {
      // Save the note
      notesActions.saveNote(content, new Date());
    }
  }

  function handleKeyDown(event, note = null) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleBlockSave(event, note);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.target.contentEditable = false;
      event.target.classList.remove('editing');
      // Restore original content if it was an existing note
      if (note) {
        event.target.textContent = note.contents;
      }
    }
  }

  function createNewBlock() {
    // Create a new block at the current time
    notesActions.saveNote('', new Date());
  }
  
  function logout() {
    authActions.logout();
  }

  function formatTimestamp(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
             ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
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
        {$user?.phone || $user?.email || 'Loading...'}
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

<!-- Main Timeline Area -->
<div class="pt-16 pb-20 min-h-screen bg-white">
  <div class="max-w-4xl mx-auto px-4 py-8">
    {#if $isLoading}
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">Loading your notes...</span>
      </div>
    {:else}
      <!-- Timeline Container -->
      <div bind:this={timelineContainer} class="timeline-container">
        
        <!-- Past Notes -->
        {#each pastNotes as note (note.id)}
          <div class="timeline-block">
            <div class="timestamp-gutter">
              <span class="timestamp">{formatTimestamp(note.created_at)}</span>
            </div>
            <div class="content-area">
              <div 
                class="editable-block past-note"
                on:click={(e) => handleBlockEdit(e, note)}
                on:blur={(e) => handleBlockSave(e, note)}
                on:keydown={(e) => handleKeyDown(e, note)}
                role="textbox"
                tabindex="0"
              >
                {note.contents}
              </div>
            </div>
          </div>
        {/each}

        <!-- Now Marker -->
        <div bind:this={nowMarker} class="timeline-block now-marker">
          <div class="timestamp-gutter">
            <span class="timestamp now-time">{formatTimestamp(new Date().toISOString())}</span>
          </div>
          <div class="content-area">
            <div class="now-line">
              <span class="now-badge">Now</span>
              <div class="now-border"></div>
            </div>
          </div>
        </div>

        <!-- New editable block at "now" -->
        <div class="timeline-block">
          <div class="timestamp-gutter">
            <span class="timestamp-placeholder">•</span>
          </div>
          <div class="content-area">
            <div 
              class="editable-block new-block"
              on:click={handleBlockEdit}
              on:blur={handleBlockSave}
              on:keydown={handleKeyDown}
              role="textbox"
              tabindex="0"
              data-placeholder="Start writing your thoughts..."
            ></div>
          </div>
        </div>

        <!-- Future Notes -->
        {#each futureNotes as note (note.id)}
          <div class="timeline-block">
            <div class="timestamp-gutter">
              <span class="timestamp future">{formatTimestamp(note.created_at)}</span>
            </div>
            <div class="content-area">
              <div 
                class="editable-block future-note"
                on:click={(e) => handleBlockEdit(e, note)}
                on:blur={(e) => handleBlockSave(e, note)}
                on:keydown={(e) => handleKeyDown(e, note)}
                role="textbox"
                tabindex="0"
              >
                {note.contents}
              </div>
            </div>
          </div>
        {/each}

      </div>
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
    
    <!-- Jump to Now Button -->
    <button
      on:click={jumpToNow}
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
  .timeline-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 100%;
  }

  .timeline-block {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    min-height: 2.5rem;
  }

  .timestamp-gutter {
    width: 120px;
    flex-shrink: 0;
    text-align: right;
    padding-top: 0.5rem;
  }

  .timestamp {
    font-size: 0.75rem;
    color: #6b7280;
    font-mono: true;
  }

  .timestamp.now-time {
    color: #3b82f6;
    font-weight: 600;
  }

  .timestamp.future {
    color: #9ca3af;
  }

  .timestamp-placeholder {
    font-size: 0.75rem;
    color: #d1d5db;
  }

  .content-area {
    flex: 1;
    min-width: 0;
  }

  .editable-block {
    min-height: 1.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    cursor: text;
    transition: all 0.2s ease;
    word-wrap: break-word;
    outline: none;
  }

  .editable-block:hover {
    background-color: #f9fafb;
  }

  .editable-block.editing {
    background-color: #ffffff;
    border: 2px solid #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .editable-block.new-block:empty::before {
    content: attr(data-placeholder);
    color: #9ca3af;
    pointer-events: none;
  }

  .editable-block.past-note {
    border-left: 3px solid #e5e7eb;
  }

  .editable-block.future-note {
    border-left: 3px solid #d1d5db;
    color: #6b7280;
  }

  .now-marker {
    margin: 1rem 0;
  }

  .now-line {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .now-badge {
    background: #3b82f6;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    flex-shrink: 0;
  }

  .now-border {
    flex: 1;
    height: 2px;
    background: #3b82f6;
    border-radius: 1px;
  }
</style>
