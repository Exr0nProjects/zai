import { Heading } from '@tiptap/extension-heading';

export const ExtendedHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      blockId: {
        default: null,
        renderHTML: attributes => {
          if (!attributes.blockId) return {};
          return { 'data-block-id': attributes.blockId };
        },
        parseHTML: element => element.getAttribute('data-block-id'),
      },
      createdAt: {
        default: null,
        renderHTML: attributes => {
          if (!attributes.createdAt) return {};
          return { 'data-created-at': attributes.createdAt };
        },
        parseHTML: element => element.getAttribute('data-created-at'),
      },
      parentId: {
        default: null,
        renderHTML: attributes => {
          if (!attributes.parentId) return {};
          return { 'data-parent-id': attributes.parentId };
        },
        parseHTML: element => element.getAttribute('data-parent-id'),
      },
    };
  },
}); 