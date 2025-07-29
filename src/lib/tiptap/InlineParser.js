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
            // Use chrono with forwardDate option to prefer future dates
            const results = chrono.parse(text, new Date(), { forwardDate: true });
            
            if (context && context.debugMode) {
                console.log('Chrono parsing:', text, 'found:', results);
            }
            
            return results.map(result => ({
                start: result.index,
                end: result.index + result.text.length,
                value: result.text,
                parsedDate: result.date()
            }));
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
          return attributes.parsedDate ? { 'data-parsed-date': attributes.parsedDate.toISOString() } : {};
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-pattern-date]' }];
  },

  renderHTML({ HTMLAttributes, mark }) {
    const parsedDateAttr = mark.attrs.parsedDate ? 
      { 'data-parsed-date': mark.attrs.parsedDate.toISOString() } : {};
      
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

// Helper to check what was just typed
function getLastTypedChar(transaction) {
  if (!transaction.docChanged) return null;
  
  const steps = transaction.steps;
  for (const step of steps) {
    if (step.jsonID === 'replace' && step.slice.content.size > 0) {
      const text = step.slice.content.textBetween(0, step.slice.content.size);
      return text.slice(-1);
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
      
      // Completion characters that trigger parsing
      completionChars: [' ', '.', ',', '!', '?', '\n'],
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

  // Listen for completion triggers
  onUpdate({ transaction, editor }) {
    if (!this.options.enabled || !transaction.docChanged) return;
    
    // Only process user typing, not programmatic changes
    if (transaction.getMeta('preventParsing')) return;
    
    const lastChar = getLastTypedChar(transaction);
    
    if (this.options.completionChars.includes(lastChar)) {
      if (this.options.debugMode) {
        console.log('🎯 Completion trigger:', lastChar);
      }
      
      // Use standalone function with extension reference
      const extension = this;
      setTimeout(() => processPatterns(extension, editor), 10);
    }
  },

  onCreate() {
    if (this.options.debugMode) {
      console.log('🎨 Pattern Highlighter extension loaded');
      console.log('📝 Parsers registered:', this.options.parsers.length);
      
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