import Paragraph from '@tiptap/extension-paragraph';
import { generateBlockId, getCurrentTimestamp } from '../utils/snowflake.js';

export const ExtendedParagraph = Paragraph.extend({
  name: 'paragraph',

  addAttributes() {
    return {
      ...this.parent?.(),
      blockId: {
        default: null,
        renderHTML: (attributes) => ({
          'data-block-id': attributes.blockId,
        }),
        parseHTML: (element) => element.getAttribute('data-block-id'),
      },
      createdAt: {
        default: null,
        renderHTML: (attributes) => ({
          'data-created-at': attributes.createdAt,
        }),
        parseHTML: (element) => element.getAttribute('data-created-at'),
      },
      parentId: {
        default: null,
        renderHTML: (attributes) => ({
          'data-parent-id': attributes.parentId,
        }),
        parseHTML: (element) => element.getAttribute('data-parent-id'),
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      Enter: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const currentNode = state.doc.nodeAt(selection.from);
        const currentNodePos = selection.$from.before();
        
        // Get current block's attributes
        const currentAttrs = state.doc.nodeAt(currentNodePos)?.attrs || {};
        const currentBlockId = currentAttrs.blockId;
        
        // Create new block with fresh ID and timestamp
        const newBlockId = generateBlockId();
        const timestamp = getCurrentTimestamp();
        
        return editor.chain()
          .splitBlock()
          .updateAttributes('paragraph', {
            blockId: newBlockId,
            createdAt: timestamp,
            parentId: currentBlockId,
          })
          .run();
      },
    };
  },

  onCreate() {
    // Add ID and timestamp to new paragraphs created programmatically
    this.editor.on('create', () => {
      this.editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'paragraph' && !node.attrs.blockId) {
          this.editor.chain()
            .setNodeSelection(pos)
            .updateAttributes('paragraph', {
              blockId: generateBlockId(),
              createdAt: getCurrentTimestamp(),
              parentId: null,
            })
            .run();
        }
      });
    });
  },
}); 