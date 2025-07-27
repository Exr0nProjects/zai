import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase.js';
import { user } from './auth.js';
import { get } from 'svelte/store';

export const notes = writable([]);
export const isLoading = writable(false);

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
        console.warn('No user ID available');
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
        user_id: currentUser.id, // Use Supabase auth user ID
        created_at: timestamp.toISOString(),
        type: 'md',
        contents: content.trim()
      };

      // Optimistically add to local store
      notes.update(currentNotes => [...currentNotes, note]);

      // Try to save to database - RLS will automatically filter by auth.uid()
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

  // Combine all notes into a single document for Tiptap
  buildTimelineDocument(notesArray, currentTime = new Date()) {
    if (!notesArray?.length) {
      return {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Start writing your thoughts...'
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

    const sortedNotes = [...notesArray].sort((a, b) => 
      new Date(a.created_at) - new Date(b.created_at)
    );

    const content = [];
    let timelineInserted = false;

    for (const note of sortedNotes) {
      const noteTime = new Date(note.created_at);
      
      // Insert timeline mark if we've passed the current time
      if (!timelineInserted && noteTime > currentTime) {
        content.push({
          type: 'paragraph',
          marks: [{ type: 'timeline' }],
          content: []
        });
        timelineInserted = true;
      }

      // Add the note content
      if (note.contents.trim()) {
        content.push({
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: note.contents
            }
          ]
        });
      }
    }

    // If timeline wasn't inserted (all notes are in the past), add it at the end
    if (!timelineInserted) {
      content.push({
        type: 'paragraph',
        marks: [{ type: 'timeline' }],
        content: []
      });
    }

    // Always end with an empty paragraph for continued writing
    content.push({
      type: 'paragraph',
      content: []
    });

    return {
      type: 'doc',
      content
    };
  }
}; 