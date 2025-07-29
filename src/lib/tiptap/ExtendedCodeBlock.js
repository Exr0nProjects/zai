import CodeBlock from '@tiptap/extension-code-block';
import { generateBlockId, getCurrentTimestamp } from '../utils/snowflake.js';

export const ExtendedCodeBlock = CodeBlock.extend({
  name: 'codeBlock',

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

  // onCreate removed - TimestampPlugin handles automatic timestamping
}); 