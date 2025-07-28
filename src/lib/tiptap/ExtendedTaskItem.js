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

  // Removed addKeyboardShortcuts to avoid interfering with default task list behavior
  // Timestamps are now handled by TimestampPlugin

  // onCreate removed - TimestampPlugin handles automatic timestamping
}); 