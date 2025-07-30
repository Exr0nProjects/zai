/**
 * Clean Pattern Highlighting Extension
 * Simple interface: you provide parsers, we highlight patterns with marks
 */

import { Extension, Mark } from '@tiptap/core';
import * as chrono from 'chrono-node';

export const PARSERS = [
    {
        markType: 'patternDate',
        parse: (text, context) => {
            // Use chrono with forwardDate option to prefer future dates and local timezone
            const results = chrono.parse(text, new Date(), { 
                forwardDate: true,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });
            
            if (context && context.debugMode) {
                console.log('Chrono parsing:', text, 'found:', results);
            }
            
            // Score results by specificity and return the most specific one
            if (results.length === 0) return [];
            
            const scoredResults = results.map(result => {
                const parsedDate = result.start.date();
                const start = result.start;
                
                // Calculate specificity score (higher = more specific)
                let specificity = 0;
                
                // Time components (most valuable)
                if (start.get('hour') !== undefined) specificity += 4;
                if (start.get('minute') !== undefined) specificity += 2;
                if (start.get('second') !== undefined) specificity += 1;
                
                // Date components
                if (start.get('year') !== undefined) specificity += 3;
                if (start.get('month') !== undefined) specificity += 3;
                if (start.get('day') !== undefined) specificity += 3;
                
                // Day of week
                if (start.get('weekday') !== undefined) specificity += 1;
                
                // Prefer longer text spans (more context)
                specificity += result.text.length * 0.1;
                
                return {
                    start: result.index,
                    end: result.index + result.text.length,
                    value: result.text,
                    parsedDate: parsedDate,
                    specificity: specificity,
                    chronoResult: result
                };
            });
            
            // Sort by specificity (highest first) and return the most specific
            scoredResults.sort((a, b) => b.specificity - a.specificity);
            
            if (context && context.debugMode) {
                console.log('🕒 Chrono specificity scores:', scoredResults.map(r => ({
                    text: r.value,
                    score: r.specificity,
                    components: {
                        hour: r.chronoResult.start.get('hour'),
                        minute: r.chronoResult.start.get('minute'),
                        day: r.chronoResult.start.get('day'),
                        month: r.chronoResult.start.get('month'),
                        year: r.chronoResult.start.get('year'),
                        weekday: r.chronoResult.start.get('weekday')
                    }
                })));
            }
            
            // Return only the most specific result
            return [scoredResults[0]];
        }
    },
    {
        markType: 'patternTag',
        parse: (text, context) => {
            // search for /(#\w+)/g and return the matches with correct indices
            const results = [];
            const regex = /#[-_\w]+/g;
            let match;
            
            while ((match = regex.exec(text)) !== null) {
                results.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    value: match[0]
                });
            }
            
            console.log('Parsing tag:', text, 'found:', results);
            return results;
        }
    }  
]

// Date mark for highlighting date patterns
const DateMark = Mark.create({
  name: 'patternDate',
  
  addAttributes() {
    return {
      type: {
        default: 'date',
        parseHTML: element => element.getAttribute('data-pattern-type'),
        renderHTML: attributes => ({ 'data-pattern-type': attributes.type }),
      },
      value: {
        default: '',
        parseHTML: element => element.getAttribute('data-pattern-value'),
        renderHTML: attributes => ({ 'data-pattern-value': attributes.value }),
      },
      parsedDate: {
        default: null,
        parseHTML: element => {
          const dateStr = element.getAttribute('data-parsed-date');
          return dateStr ? new Date(dateStr) : null;
        },
        renderHTML: attributes => {
          if (!attributes.parsedDate) return {};
          const isoString = typeof attributes.parsedDate === 'string' 
            ? attributes.parsedDate 
            : attributes.parsedDate.toISOString();
          return { 'data-parsed-date': isoString };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-pattern-date]' }];
  },

  renderHTML({ HTMLAttributes, mark }) {
    const parsedDateAttr = mark.attrs.parsedDate ? 
      { 'data-parsed-date': typeof mark.attrs.parsedDate === 'string' 
          ? mark.attrs.parsedDate 
          : mark.attrs.parsedDate.toISOString() } : {};
      
    return [
      'span',
      {
        ...HTMLAttributes,
        'data-pattern-date': '',
        'data-pattern-type': mark.attrs.type,
        'data-pattern-value': mark.attrs.value,
        ...parsedDateAttr,
        class: `pattern-date pattern-date-${mark.attrs.type}`,
        style: 'position: relative;',
      },
      0,
    ];
  },
});

// Tag mark for highlighting tag patterns
const TagMark = Mark.create({
  name: 'patternTag',
  
  addAttributes() {
    return {
      value: {
        default: '',
        parseHTML: element => element.getAttribute('data-pattern-value'),
        renderHTML: attributes => ({ 'data-pattern-value': attributes.value }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-pattern-tag]' }];
  },

  renderHTML({ HTMLAttributes, mark }) {
    return [
      'span',
      {
        ...HTMLAttributes,
        'data-pattern-tag': '',
        'data-pattern-value': mark.attrs.value,
        class: 'pattern-tag',
      },
      0,
    ];
  },
});

// Context helper functions
function getCurrentTypingContext(editor) {
  const { state } = editor;
  const { selection } = state;
  const { $from } = selection;
  
  const currentNode = $from.node();
  if (!currentNode || !currentNode.isTextblock) return null;
  
  const nodeStart = $from.start($from.depth);
  const fullText = currentNode.textContent;
  const cursorPos = $from.pos - nodeStart;
  
  return {
    fullText,        // Complete text of current paragraph
    cursorPos,       // Cursor position within that text
    nodeStart,       // Absolute position in document
    node: currentNode,
    nodeEnd: nodeStart + currentNode.nodeSize - 2, // -2 for start/end tokens
  };
}

// Throttle utility function
function throttle(func, delay) {
  let timeoutId;
  let lastExecTime = 0;
  
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

// Helper to find the nearest parent block with blockId
function findBlockWithId(state, fromPos) {
  const $pos = state.doc.resolve(fromPos);
  
  // Traverse upwards through the document tree
  for (let depth = $pos.depth; depth >= 0; depth--) {
    const node = $pos.node(depth);
    
    // Check if this is a block node with blockId
    if (node.isBlock && node.attrs && node.attrs.blockId) {
      // Skip the root document (depth 0) as it can't have markup changed
      if (depth === 0) continue;
      
      // Use $pos.before(depth) to get the position just before the node
      const nodePos = $pos.before(depth);
      
      return {
        node,
        pos: nodePos
      };
    }
  }
  
  return null;
}

// Standalone function to process patterns
function processPatterns(extension, editor) {
  if (!extension.options.enabled || !extension.options.parsers.length) return;
  
  const context = getCurrentTypingContext(editor);
  if (!context) return;
  
  if (extension.options.debugMode) {
    console.log('🔍 Processing text:', context.fullText);
  }
  
  const { state } = editor;
  const tr = state.tr;
  let hasChanges = false;
  
  // First, clear existing pattern marks in current block
  const markTypes = [state.schema.marks.patternDate, state.schema.marks.patternTag];
  markTypes.forEach(markType => {
    if (markType) {
      tr.removeMark(context.nodeStart, context.nodeEnd, markType);
      hasChanges = true;
    }
  });
  
    // Run each parser you provided
  extension.options.parsers.forEach(parser => {
    try {
      const results = parser.parse(context.fullText, context);
      
      if (results && results.length > 0) {
        results.forEach(result => {
          const from = context.nodeStart + result.start;
          const to = context.nodeStart + result.end;
          
          if (extension.options.debugMode) {
            console.log(`🎨 ${parser.markType} highlighting:`, result);
          }
          
          // Apply appropriate mark type
          const markType = state.schema.marks[parser.markType];
          if (markType) {
            if (parser.markType === 'patternDate') {
              tr.addMark(from, to, markType.create({
                type: 'date',
                value: result.value || result.text || context.fullText.slice(result.start, result.end),
                parsedDate: result.parsedDate || null
              }));
              
                              // Set timelineTime on the nearest parent block with blockId if we have a parsed date
                if (result.parsedDate) {
                  const targetBlock = findBlockWithId(state, context.nodeStart);
                  if (targetBlock) {
                    // Store as ISO string like createdAt
                    const dateToSet = result.parsedDate instanceof Date 
                      ? result.parsedDate.toISOString() 
                      : new Date(result.parsedDate).toISOString();
                    
                    tr.setNodeMarkup(targetBlock.pos, undefined, {
                      ...targetBlock.node.attrs,
                      timelineTime: dateToSet
                    });
                    
                    if (extension.options.debugMode) {
                      console.log('🕒 Set timelineTime on block:', targetBlock.node.type.name, 'date:', dateToSet);
                    }
                  } else if (extension.options.debugMode) {
                    console.log('⚠️ No block with blockId found for timelineTime');
                  }
                }
            } else if (parser.markType === 'patternTag') {
              tr.addMark(from, to, markType.create({
                value: result.value || result.text || context.fullText.slice(result.start, result.end)
              }));
            }
            hasChanges = true;
          }
        });
      }
    } catch (error) {
      console.error(`Error in parser ${parser.markType}:`, error);
    }
  });
  
  // Apply changes if any
  if (hasChanges) {
    // Prevent infinite loops by marking this as a programmatic change
    tr.setMeta('preventParsing', true);
    editor.view.dispatch(tr);
  }
}

// Main extension
export const InlineParser = Extension.create({
  name: 'patternHighlighter',

  addOptions() {
    return {
      enabled: true,
      debugMode: false,
      
      // Array of parser functions you provide
      parsers: PARSERS,
      
      // Throttle delay in milliseconds
      throttleDelay: 100,
    };
  },

  addExtensions() {
    return [DateMark, TagMark];
  },

  addCommands() {
    return {
      // Main command: highlight patterns in current block
      highlightPatterns: () => ({ editor }) => {
        processPatterns(this, editor);
        return true;
      },

      // Clear all pattern marks in current block
      clearPatterns: () => ({ commands }) => {
        commands.unsetMark('patternDate');
        commands.unsetMark('patternTag');
        return true;
      },

      // Toggle parsing
      toggleParsing: () => ({ editor }) => {
        this.options.enabled = !this.options.enabled;
        console.log('Pattern parsing:', this.options.enabled ? 'enabled' : 'disabled');
        return true;
      },
    };
  },

  // Listen for any document changes and throttle pattern processing
  onUpdate({ transaction, editor }) {
    if (!this.options.enabled || !transaction.docChanged) return;
    
    // Only process user typing, not programmatic changes
    if (transaction.getMeta('preventParsing') || transaction.getMeta('timelineSort')) return;
    
    // Initialize throttled function if not already done (safety check)
    if (!this.throttledProcessPatterns) {
      this.throttledProcessPatterns = throttle(
        (extension, editor) => processPatterns(extension, editor),
        this.options.throttleDelay
      );
    }
    
    // Use throttled processing for better performance
    this.throttledProcessPatterns(this, editor);
  },

  onCreate() {
    // Initialize throttled pattern processing function
    this.throttledProcessPatterns = throttle(
      (extension, editor) => processPatterns(extension, editor),
      this.options.throttleDelay
    );
    
    if (this.options.debugMode) {
      console.log('🎨 Pattern Highlighter extension loaded');
      console.log('📝 Parsers registered:', this.options.parsers.length);
      console.log('⏱️ Throttle delay:', this.options.throttleDelay + 'ms');
      
      // Add debug helpers to global scope
      window.highlightPatterns = () => this.editor.commands.highlightPatterns();
      window.clearPatterns = () => this.editor.commands.clearPatterns();
      window.toggleParsing = () => this.editor.commands.toggleParsing();
      window.getContext = () => getCurrentTypingContext(this.editor);
      window.processPatterns = () => processPatterns(this, this.editor);
    }
  },
});

// Export helper for creating parsers
export function createParser(markType, parseFunction) {
  return {
    markType, // 'patternDate' or 'patternTag'
    parse: parseFunction,
  };
} 