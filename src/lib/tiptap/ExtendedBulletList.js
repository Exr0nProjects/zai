import BulletList from '@tiptap/extension-bullet-list';
import { generateBlockId, getCurrentTimestamp } from '../utils/snowflake.js';

export const ExtendedBulletList = BulletList.extend({
  name: 'bulletList',

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
    // Add ID and timestamp to new bullet lists created programmatically
    this.editor.on('create', () => {
      this.editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'bulletList' && !node.attrs.blockId) {
          this.editor.chain()
            .setNodeSelection(pos)
            .updateAttributes('bulletList', {
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