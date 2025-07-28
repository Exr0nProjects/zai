import TaskList from '@tiptap/extension-task-list';
import { generateBlockId, getCurrentTimestamp } from '../utils/snowflake.js';

export const ExtendedTaskList = TaskList.extend({
  name: 'taskList',

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

  onCreate() {
    // Add ID and timestamp to new task lists created programmatically
    this.editor.on('create', () => {
      this.editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'taskList' && !node.attrs.blockId) {
          this.editor.chain()
            .setNodeSelection(pos)
            .updateAttributes('taskList', {
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