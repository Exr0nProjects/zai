import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase.js';
import { user } from './auth.js';
import { get } from 'svelte/store';

export const notes = writable([]);
export const isLoading = writable(false);
// Track which note ID is currently being edited to prevent clobbering
export const currentlyEditingNoteId = writable(null);

// Real-time subscription channel
let realtimeChannel = null;

// Generate client-side ID that fits in PostgreSQL bigint (64-bit signed integer)
function generateNoteId() {
  const currentUser = get(user);
  const userPhone = currentUser?.phone || '';
  
  // Use timestamp in seconds (not milliseconds) to save space - 32 bits is enough until 2106
  const timestampSec = Math.floor(Date.now() / 1000);
  
  // Use more bits for phone number (last 5 digits) - 16 bits (up to 65536)
  const userHash = userPhone.slice(-5).padStart(5, '0');
  const userNum = parseInt(userHash) % 65536; // Ensure it fits in 16 bits
  
  // Random component - 16 bits (65536 possible values per second)
  const randomPart = Math.floor(Math.random() * 65536); // 2^16
  
  // Combine into 64-bit integer: timestamp(32) + user(16) + random(16) = 64 bits
  // Shift left to combine: (timestamp << 32) | (user << 16) | random
  const id = (timestampSec * Math.pow(2, 32)) + (userNum * Math.pow(2, 16)) + randomPart;
  
  // Return as string to avoid JavaScript number precision issues
  return id.toString();
}

export const notesActions = {
  async loadNotes() {
    isLoading.set(true);
    try {
      const currentUser = get(user);
      
      if (!currentUser?.id) {
        console.warn('No user ID available for loading notes');
        notes.set([]);
        return;
      }

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading notes:', error);
        // Graceful fallback - continue without database
        notes.set([]);
        return;
      }

      notes.set(data || []);
    } catch (error) {
      console.error('Notes loading error:', error);
      notes.set([]);
    } finally {
      isLoading.set(false);
    }
  },

  // Track which note is currently being edited
  setCurrentlyEditing(noteId) {
    currentlyEditingNoteId.set(noteId);
  },

  clearCurrentlyEditing() {
    currentlyEditingNoteId.set(null);
  },

  // Set up real-time subscription for notes
  async setupRealtimeSubscription() {
    const currentUser = get(user);
    if (!currentUser?.id) {
      console.warn('No user available for real-time subscription');
      return;
    }

    // Clean up existing subscription
    if (realtimeChannel) {
      await supabase.removeChannel(realtimeChannel);
    }

    // Create new subscription for this user's notes
    realtimeChannel = supabase
      .channel('notes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          const editingNoteId = get(currentlyEditingNoteId);
          
          // Handle different types of changes
          if (payload.eventType === 'INSERT') {
            // Only add if it's not the note currently being edited (avoid duplicates from our own saves)
            if (payload.new.id !== editingNoteId) {
              notes.update(currentNotes => {
                // Check if note already exists (to avoid duplicates)
                const exists = currentNotes.some(note => note.id === payload.new.id);
                if (!exists) {
                  return [...currentNotes, payload.new];
                }
                return currentNotes;
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            // Only update if it's not the note currently being edited
            if (payload.new.id !== editingNoteId) {
              notes.update(currentNotes =>
                currentNotes.map(note =>
                  note.id === payload.new.id ? payload.new : note
                )
              );
            }
          } else if (payload.eventType === 'DELETE') {
            notes.update(currentNotes =>
              currentNotes.filter(note => note.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();
  },

  // Clean up real-time subscription
  async cleanupRealtimeSubscription() {
    if (realtimeChannel) {
      await supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  },

  async saveNote(content, timestamp = new Date()) {
    try {
      const currentUser = get(user);
      if (!currentUser?.id) {
        console.warn('No user available for saving note');
        return null;
      }

      const noteId = generateNoteId();
      const note = {
        id: noteId,
        user_id: currentUser.id,
        created_at: timestamp.toISOString(),
        type: 'md',
        contents: content.trim()
      };

      // Optimistically add to local store
      notes.update(currentNotes => [...currentNotes, note]);

      // Try to save to database
      const { data, error } = await supabase
        .from('notes')
        .insert([note])
        .select()
        .single();

      if (error) {
        console.error('Error saving note:', error);
        // Remove from local store if save failed
        notes.update(currentNotes => 
          currentNotes.filter(n => n.id !== noteId)
        );
        return null;
      }

      return data;
    } catch (error) {
      console.error('Note saving error:', error);
      return null;
    }
  },

  async updateNote(noteId, newContent) {
    try {
      const currentUser = get(user);
      if (!currentUser?.id) {
        console.warn('No user available for updating note');
        return null;
      }

      // Update in local store first (preserve original timestamp)
      notes.update(currentNotes => 
        currentNotes.map(note => 
          note.id === noteId 
            ? { ...note, contents: newContent.trim() }
            : note
        )
      );

      // Try to update in database (only update contents, NOT timestamp)
      const { data, error } = await supabase
        .from('notes')
        .update({ 
          contents: newContent.trim()
        })
        .eq('id', noteId)
        .eq('user_id', currentUser.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating note:', error);
        // Revert local changes if update failed
        await this.loadNotes(); // Reload from database to get correct state
        return null;
      }

      return data;
    } catch (error) {
      console.error('Note updating error:', error);
      return null;
    }
  },

  // Simple document builder: each note = one paragraph with data-note-id
  // currentEditorContent: object mapping noteId -> current content in editor (to preserve while typing)
  buildTimelineDocument(notesArray, currentTime = new Date(), currentEditorContent = {}) {
    const editingNoteId = get(currentlyEditingNoteId);
    
    if (!notesArray?.length) {
      return {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { class: 'timeline-now' },
            content: [
              {
                type: 'text',
                text: '​', // Zero-width space for timeline mark
                marks: [{ type: 'timeline' }]
              }
            ]
          },
          {
            type: 'paragraph',
            attrs: { class: 'future-content' },
            content: []
          }
        ]
      };
    }

    const sortedNotes = [...notesArray].sort((a, b) => 
      new Date(a.created_at) - new Date(b.created_at)
    );

    const content = [];
    let timelineInserted = false;

    for (const note of sortedNotes) {
      const noteTime = new Date(note.created_at);
      const timeStr = noteTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });

      // Insert timeline mark before first future note
      if (!timelineInserted && noteTime > currentTime) {
        content.push({
          type: 'paragraph',
          attrs: { class: 'timeline-now' },
          content: [
            {
              type: 'text',
              text: '​', // Zero-width space for timeline mark
              marks: [{ type: 'timeline' }]
            }
          ]
        });
        timelineInserted = true;
      }

      // Use current editor content if this note is being edited, otherwise use database content
      const noteContent = (editingNoteId === note.id && currentEditorContent[note.id] !== undefined) 
        ? currentEditorContent[note.id] 
        : note.contents.trim();

      // Add note as simple paragraph
      content.push({
        type: 'paragraph',
        attrs: {
          noteId: note.id,
          timestamp: timeStr,
          class: noteTime <= currentTime ? 'past-content' : 'future-content'
        },
        content: noteContent ? [
          {
            type: 'text', 
            text: noteContent
          }
        ] : []
      });
    }

    // If no future notes, add timeline at end
    if (!timelineInserted) {
      content.push({
        type: 'paragraph',
        attrs: { class: 'timeline-now' },
        content: [
          {
            type: 'text',
            text: '​', // Zero-width space for timeline mark
            marks: [{ type: 'timeline' }]
          }
        ]
      });
    }

    // Add empty paragraph for new content
    content.push({
      type: 'paragraph',
      attrs: { class: 'future-content' },
      content: []
    });

    return {
      type: 'doc',
      content
    };
  }
}; 