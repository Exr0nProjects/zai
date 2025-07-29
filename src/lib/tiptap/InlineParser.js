/**
 * Clean Chip Parser Extension
 * Simple interface: you provide parsers, we handle TipTap integration
 */

import { Extension, Node } from '@tiptap/core';

// DateChip node - accepts JS Date objects directly
const DateChip = Node.create({
  name: 'dateChip',
  
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      date: {
        default: null,
        // Store the JS Date as ISO string for serialization
        parseHTML: element => {
          const dateStr = element.getAttribute('data-date');
          return dateStr ? new Date(dateStr) : null;
        },
        renderHTML: attributes => {
          return attributes.date ? { 'data-date': attributes.date.toISOString() } : {};
        },
      },
      displayText: {
        default: '',
        parseHTML: element => element.getAttribute('data-display-text') || '',
        renderHTML: attributes => ({ 'data-display-text': attributes.displayText }),
      },
      originalText: {
        default: '',
        parseHTML: element => element.getAttribute('data-original-text') || '',
        renderHTML: attributes => ({ 'data-original-text': attributes.originalText }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-date-chip]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'span',
      {
        ...HTMLAttributes,
        'data-date-chip': '',
        class: 'date-chip',
        contenteditable: 'false',
      },
      node.attrs.displayText || node.attrs.originalText,
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span');
      dom.setAttribute('data-date-chip', '');
      dom.className = 'date-chip';
      dom.contentEditable = 'false';
      dom.textContent = node.attrs.displayText || node.attrs.originalText;
      
      // Add click handler for future interactions
      dom.addEventListener('click', () => {
        console.log('Date clicked:', {
          date: node.attrs.date,
          originalText: node.attrs.originalText
        });
        // Your future date picker logic here
      });
      
      return { dom };
    };
  },
});

// TagChip node - accepts tag text (including #)
const TagChip = Node.create({
  name: 'tagChip',
  
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      tagText: {
        default: '',
        parseHTML: element => element.getAttribute('data-tag-text') || '',
        renderHTML: attributes => ({ 'data-tag-text': attributes.tagText }),
      },
      originalText: {
        default: '',
        parseHTML: element => element.getAttribute('data-original-text') || '',
        renderHTML: attributes => ({ 'data-original-text': attributes.originalText }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-tag-chip]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'span',
      {
        ...HTMLAttributes,
        'data-tag-chip': '',
        class: 'tag-chip',
        contenteditable: 'false',
      },
      node.attrs.tagText,
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span');
      dom.setAttribute('data-tag-chip', '');
      dom.className = 'tag-chip';
      dom.contentEditable = 'false';
      dom.textContent = node.attrs.tagText;
      
      // Add click handler for future interactions
      dom.addEventListener('click', () => {
        console.log('Tag clicked:', {
          tagText: node.attrs.tagText,
          originalText: node.attrs.originalText
        });
        // Your future tag logic here
      });
      
      return { dom };
    };
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
    
    // Helper to get text around cursor
    getContextAround(radius = 50) {
      const start = Math.max(0, cursorPos - radius);
      const end = Math.min(fullText.length, cursorPos + radius);
      return {
        text: fullText.slice(start, end),
        offsetInFull: start,
        absoluteStart: nodeStart + start,
        absoluteEnd: nodeStart + end,
      };
    },
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

// Main extension
export const InlineParser = Extension.create({
  name: 'chipParser',

  addOptions() {
    return {
      enabled: true,
      debugMode: false,
      
      // Array of parser functions you provide
      parsers: [
        // Example parser structure (you'll replace these):
        // {
        //   name: 'dates',
        //   parse: (text, context) => [{ start: 0, end: 5, data: new Date() }],
        //   createChip: 'dateChip'
        // }
      ],
      
      // Completion characters that trigger parsing
      completionChars: [' ', '.', ',', '!', '?', '\n'],
    };
  },

  addExtensions() {
    return [DateChip, TagChip];
  },

  addCommands() {
    return {
      // Main command: create chip from parser result
      insertDateChip: ({ from, to, data }) => ({ commands }) => {
        const displayText = this.options.formatDate ? this.options.formatDate(data.date) : data.originalText;
        
        return commands
          .deleteRange({ from, to })
          .insertContentAt(from, {
            type: 'dateChip',
            attrs: {
              date: data.date,
              displayText: data.displayText || displayText,
              originalText: data.originalText,
            },
          });
      },

      insertTagChip: ({ from, to, data }) => ({ commands }) => {
        return commands
          .deleteRange({ from, to })
          .insertContentAt(from, {
            type: 'tagChip',
            attrs: {
              tagText: data.tagText,
              originalText: data.originalText,
            },
          });
      },

      // Helper: run your parsers manually
      runParsers: () => ({ editor }) => {
        this.processParsers();
        return true;
      },

      // Toggle parsing
      toggleParsing: () => ({ editor }) => {
        this.options.enabled = !this.options.enabled;
        console.log('Chip parsing:', this.options.enabled ? 'enabled' : 'disabled');
        return true;
      },
    };
  },

  // Method to process your parsers
  processParsers() {
    if (!this.options.enabled || !this.options.parsers.length) return;
    
    const context = getCurrentTypingContext(this.editor);
    if (!context) return;
    
    if (this.options.debugMode) {
      console.log('🔍 Processing text:', context.fullText);
    }
    
    // Run each parser you provided
    this.options.parsers.forEach(parser => {
      try {
        const results = parser.parse(context.fullText, context);
        
        if (results && results.length > 0) {
          // Process results in reverse order to maintain positions
          results.reverse().forEach(result => {
            const from = context.nodeStart + result.start;
            const to = context.nodeStart + result.end;
            
            if (this.options.debugMode) {
              console.log(`🍟 ${parser.name} found:`, result);
            }
            
            // Create appropriate chip type
            if (parser.createChip === 'dateChip') {
              this.editor.commands.insertDateChip({ from, to, data: result.data });
            } else if (parser.createChip === 'tagChip') {
              this.editor.commands.insertTagChip({ from, to, data: result.data });
            }
          });
        }
      } catch (error) {
        console.error(`Error in parser ${parser.name}:`, error);
      }
    });
  },

  // Listen for completion triggers
  onUpdate({ transaction }) {
    if (!this.options.enabled || !transaction.docChanged) return;
    
    // Only process user typing, not programmatic changes
    if (transaction.getMeta('preventParsing')) return;
    
    const lastChar = getLastTypedChar(transaction);
    
    if (this.options.completionChars.includes(lastChar)) {
      if (this.options.debugMode) {
        console.log('🎯 Completion trigger:', lastChar);
      }
      
      // Small delay to ensure DOM is updated
      setTimeout(() => this.processParsers(), 10);
    }
  },

  onCreate() {
    if (this.options.debugMode) {
      console.log('🍟 ChipParser extension loaded');
      console.log('📝 Parsers registered:', this.options.parsers.length);
      
      // Add debug helpers to global scope
      window.runParsers = () => this.editor.commands.runParsers();
      window.toggleParsing = () => this.editor.commands.toggleParsing();
      window.getContext = () => getCurrentTypingContext(this.editor);
    }
  },
});

// Export helper for creating parsers
export function createParser(name, parseFunction, chipType) {
  return {
    name,
    parse: parseFunction,
    createChip: chipType,
  };
} 