import TaskItem from '@tiptap/extension-task-item';
import { generateBlockId, getCurrentTimestamp } from '../utils/snowflake.js';

export const ExtendedTaskItem = TaskItem.extend({
  name: 'taskItem',

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
    // Get parent shortcuts first, then only override specific ones
    const parentShortcuts = this.parent?.() || {};
    
    return {
      ...parentShortcuts,
      Enter: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        
        // Find the current task item
        let currentPos = selection.from;
        let currentNode = null;
        let currentAttrs = {};
        
        state.doc.nodesBetween(selection.from, selection.from, (node, pos) => {
          if (node.type.name === 'taskItem') {
            currentNode = node;
            currentPos = pos;
            currentAttrs = node.attrs;
            return false; // Stop searching
          }
        });
        
        if (currentNode) {
          const currentBlockId = currentAttrs.blockId;
          const newBlockId = generateBlockId();
          const timestamp = getCurrentTimestamp();
          
          return editor.chain()
            .splitListItem('taskItem')
            .updateAttributes('taskItem', {
              blockId: newBlockId,
              createdAt: timestamp,
              parentId: currentBlockId,
            })
            .run();
        }
        
        return false;
      },
    };
  },

  onCreate() {
    // Add ID and timestamp to new task items created programmatically
    this.editor.on('create', () => {
      this.editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'taskItem' && !node.attrs.blockId) {
          this.editor.chain()
            .setNodeSelection(pos)
            .updateAttributes('taskItem', {
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