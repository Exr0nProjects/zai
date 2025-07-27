import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase.js';
import { user } from './auth.js';
import { get } from 'svelte/store';

export const notes = writable([]);
export const isLoading = writable(false);

// Simple markdown parser for basic formatting with indentation support
function parseMarkdownContent(text) {
  // Count leading spaces for indentation level
  const leadingSpaces = text.match(/^( *)/)[1].length;
  const indentLevel = Math.floor(leadingSpaces / 2); // 2 spaces per level
  const trimmedText = text.trim();
  
  // Check if it's a heading
  const headingMatch = trimmedText.match(/^(#{1,6})\s+(.*)$/);
  if (headingMatch) {
    return {
      type: 'heading',
      attrs: { level: headingMatch[1].length },
      content: parseInlineMarkdown(headingMatch[2])
    };
  }
  
  // Check if it's a bullet list item
  const bulletMatch = trimmedText.match(/^[-*+]\s+(.*)$/);
  if (bulletMatch) {
    return {
      type: 'paragraph', // We'll handle list structure in buildTimelineDocument
      attrs: { 
        class: 'future-content',
        listType: 'bullet',
        indentLevel: indentLevel
      },
      content: parseInlineMarkdown(bulletMatch[1])
    };
  }
  
  // Check if it's an ordered list item
  const orderedMatch = trimmedText.match(/^(\d+)\.\s+(.*)$/);
  if (orderedMatch) {
    return {
      type: 'paragraph', // We'll handle list structure in buildTimelineDocument
      attrs: { 
        class: 'future-content',
        listType: 'ordered',
        indentLevel: indentLevel
      },
      content: parseInlineMarkdown(orderedMatch[2])
    };
  }
  
  // Regular paragraph (preserve indentation if any)
  return {
    type: 'paragraph',
    attrs: { 
      class: 'future-content',
      indentLevel: indentLevel > 0 ? indentLevel : undefined
    },
    content: parseInlineMarkdown(trimmedText)
  };
}

// Parse inline markdown formatting (bold, italic, code)
function parseInlineMarkdown(text) {
  const content = [];
  let currentIndex = 0;
  
  // Regex patterns for markdown formatting
  const patterns = [
    { regex: /\*\*(.*?)\*\*/g, mark: 'strong' },
    { regex: /\*(.*?)\*/g, mark: 'em' },
    { regex: /`(.*?)`/g, mark: 'code' }
  ];
  
  // Find all matches and their positions
  const matches = [];
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[1],
        mark: pattern.mark,
        fullMatch: match[0]
      });
    }
  });
  
  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);
  
  // Process text with formatting
  matches.forEach(match => {
    // Add text before the match
    if (currentIndex < match.start) {
      const plainText = text.slice(currentIndex, match.start);
      if (plainText) {
        content.push({ type: 'text', text: plainText });
      }
    }
    
    // Add the formatted text
    content.push({
      type: 'text',
      text: match.text,
      marks: [{ type: match.mark }]
    });
    
    currentIndex = match.end;
  });
  
  // Add remaining text
  if (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex);
    if (remainingText) {
      content.push({ type: 'text', text: remainingText });
    }
  }
  
  // If no formatting was found, return the original text
  if (content.length === 0) {
    content.push({ type: 'text', text: text });
  }
  
  return content;
}

// Group consecutive list items into proper TipTap list structures
function groupListItems(nodeDataArray) {
  const result = [];
  let i = 0;
  
  while (i < nodeDataArray.length) {
    const currentNode = nodeDataArray[i];
    
    // If this isn't a list item, add it directly
    if (!currentNode.attrs?.listType) {
      result.push(currentNode);
      i++;
      continue;
    }
    
    // Start building a list
    const listType = currentNode.attrs.listType;
    const listNode = {
      type: listType === 'bullet' ? 'bulletList' : 'orderedList',
      attrs: {
        class: currentNode.attrs.class,
        timestamp: currentNode.attrs.timestamp
      },
      content: []
    };
    
    // Collect all consecutive list items of the same type
    while (i < nodeDataArray.length && 
           nodeDataArray[i].attrs?.listType === listType) {
      const listItemNode = nodeDataArray[i];
      
      listNode.content.push({
        type: 'listItem',
        attrs: {
          noteId: listItemNode.attrs.noteId
        },
        content: [
          {
            type: 'paragraph',
            content: listItemNode.content
          }
        ]
      });
      
      i++;
    }
    
    result.push(listNode);
  }
  
  return result;
}

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

  async updateNote(noteId, newContent) {
    try {
      const currentUser = get(user);
      if (!currentUser?.id) {
        console.warn('No user available for updating note');
        return null;
      }

      // Check if this is a local ID that doesn't exist in DB yet
      if (noteId.startsWith('local_')) {
        console.log('🆔 Local ID detected, creating new note in database');
        // Create a new note with a proper ID
        const result = await this.saveNote(newContent.trim(), new Date());
        
        if (result) {
          // Update local store to replace the local ID with the real ID
          notes.update(currentNotes => 
            currentNotes.map(note => 
              note.id === noteId 
                ? { ...result } // Replace with the saved note data
                : note
            )
          );
        }
        return result;
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
          // Deliberately NOT updating created_at to preserve original timestamp
        })
        .eq('id', noteId)
        .eq('user_id', currentUser.id) // Ensure user can only update their own notes
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

  // Combine all notes into a single document for Tiptap
  buildTimelineDocument(notesArray, currentTime = new Date()) {
    if (!notesArray?.length) {
      return {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { class: 'past-content' },
            content: [
              {
                type: 'text',
                text: 'Start writing your thoughts...'
              }
            ]
          },
          {
            type: 'paragraph',
            attrs: { class: 'timeline-now' },
            content: [
              {
                type: 'text',
                text: '​', // Empty space for the mark to wrap
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
    let pastNotes = [];
    let futureNotes = [];

    // Separate notes into past and future
    for (const note of sortedNotes) {
      const noteTime = new Date(note.created_at);
      
      if (note.contents.trim()) {
        const timeStr = noteTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        
        // Parse markdown content into Tiptap format
        const parsedContent = parseMarkdownContent(note.contents.trim());
        
        const nodeData = {
          type: parsedContent.type || 'paragraph',
          attrs: {
            timestamp: timeStr,
            noteId: note.id,
            class: noteTime <= currentTime ? 'past-content' : 'future-content',
            ...(parsedContent.attrs || {})
          },
          content: parsedContent.content
        };
        

        
        if (noteTime <= currentTime) {
          pastNotes.push(nodeData);
        } else {
          futureNotes.push(nodeData);
        }
      }
    }

    // Group list items and add all past notes
    const groupedPastNotes = groupListItems(pastNotes);
    content.push(...groupedPastNotes);

    // Check if we should show the timeline mark (only if 2+ minutes from last note)
    let shouldShowTimeline = true;
    if (pastNotes.length > 0) {
      // Get the most recent past note's timestamp
      const lastNote = sortedNotes.filter(note => 
        new Date(note.created_at) <= currentTime && note.contents.trim()
      ).pop();
      
      if (lastNote) {
        const lastNoteTime = new Date(lastNote.created_at);
        const timeDiffMinutes = (currentTime - lastNoteTime) / (1000 * 60);
        shouldShowTimeline = timeDiffMinutes >= 2;
      }
    }

    // Add timeline mark only if there's a 2+ minute gap or no past notes
    if (shouldShowTimeline) {
      content.push({
        type: 'paragraph',
        attrs: { class: 'timeline-now' },
        content: [
          {
            type: 'text',
            text: ' ', // Empty space for the mark to wrap
            marks: [{ type: 'timeline' }]
          }
        ]
      });
    }

    // Add just one empty line after timeline for immediate writing
    content.push({
      type: 'paragraph',
      attrs: { class: 'future-content' },
      content: []
    });

    // Group list items and add all future notes
    const groupedFutureNotes = groupListItems(futureNotes);
    content.push(...groupedFutureNotes);

    return {
      type: 'doc',
      content
    };
  }
}; 