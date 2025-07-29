import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Extension } from '@tiptap/core';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const SearchHighlightPluginKey = new PluginKey('searchHighlight');

// Global state to store current search query and matches
let currentSearchQuery = '';
let currentSearchWords = [];

// Function to set search query from StreamingSearch
export function setSearchHighlight(query) {
  currentSearchQuery = query;
  currentSearchWords = query.toLowerCase().trim().split(/\s+/).filter(word => word.length > 0);
}

// Function to clear search highlights
export function clearSearchHighlight() {
  currentSearchQuery = '';
  currentSearchWords = [];
}

// Helper function to find all match positions in text
function findTextMatches(text, searchWords) {
  if (!text || searchWords.length === 0) return [];
  
  const matches = [];
  const normalizedText = text.toLowerCase();
  
  // Find positions of each search word
  searchWords.forEach(word => {
    let startIndex = 0;
    while (true) {
      const index = normalizedText.indexOf(word, startIndex);
      if (index === -1) break;
      
      matches.push({
        start: index,
        end: index + word.length,
        word: word
      });
      
      startIndex = index + 1;
    }
  });
  
  // Sort matches by position and merge overlapping ones
  matches.sort((a, b) => a.start - b.start);
  
  const mergedMatches = [];
  for (const match of matches) {
    const last = mergedMatches[mergedMatches.length - 1];
    if (last && match.start <= last.end) {
      // Merge overlapping matches
      last.end = Math.max(last.end, match.end);
    } else {
      mergedMatches.push(match);
    }
  }
  
  return mergedMatches;
}

// Helper function to find text nodes and their positions
function findTextRanges(node, offset = 0) {
  const ranges = [];
  
  if (node.isText) {
    ranges.push({
      from: offset,
      to: offset + node.nodeSize,
      text: node.text
    });
  } else {
    let pos = offset + 1; // Skip opening tag
    node.content.forEach(child => {
      ranges.push(...findTextRanges(child, pos));
      pos += child.nodeSize;
    });
  }
  
  return ranges;
}

export const SearchHighlightPlugin = Extension.create({
  name: 'searchHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: SearchHighlightPluginKey,
        
        props: {
          decorations: (state) => {
            // Only highlight if we have a search query
            if (!currentSearchQuery || currentSearchWords.length === 0) {
              return DecorationSet.empty;
            }
            
            const decorations = [];
            const { doc } = state;
            
            // Process each node that might contain text
            doc.descendants((node, pos) => {
              // Only process visible blocks (check if they have blockId and are not hidden)
              if (node.attrs && node.attrs.blockId) {
                // We can't easily check if the block is hidden here, so we'll highlight all
                // The CSS will handle not showing highlights on hidden blocks
                
                // Find all text ranges within this node
                const textRanges = findTextRanges(node, pos);
                
                textRanges.forEach(range => {
                  const matches = findTextMatches(range.text, currentSearchWords);
                  
                  matches.forEach(match => {
                    const from = range.from + match.start;
                    const to = range.from + match.end;
                    
                    // Make sure positions are valid
                    if (from >= 0 && to <= doc.content.size && from < to) {
                      decorations.push(
                        Decoration.inline(from, to, {
                          class: 'search-highlight',
                        })
                      );
                    }
                  });
                });
              }
            });
            
            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
}); 