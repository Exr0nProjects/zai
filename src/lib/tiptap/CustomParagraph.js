import { Node } from '@tiptap/core';
import { mergeAttributes } from '@tiptap/core';
import { formatTime } from '$lib/utils/format';

export const CustomParagraph = Node.create({
  name: 'paragraph',
  
  priority: 1000, // Higher priority than the default paragraph
  
  group: 'block',
  
  content: 'inline*',

  defining: true,
  
  parseHTML() {
    return [{ tag: 'p' }]
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes), 0]
  },
  
  addAttributes() {
    return {
      timestamp: {
        default: null,
        keepOnSplit: true,
        parseHTML: element => element.getAttribute('data-timestamp'),
        renderHTML: attributes => {
          if (!attributes.timestamp) {
            return {}
          }
          return {
            'data-timestamp': formatTime(attributes.timestamp),
          }
        },
      },
      noteId: {
        default: null,
        keepOnSplit: false,
        parseHTML: element => element.getAttribute('data-note-id'),
        renderHTML: attributes => {
          if (!attributes.noteId) {
            return {}
          }
          return {
            'data-note-id': attributes.noteId,
          }
        },
      },
      class: {
        default: null,
        parseHTML: element => element.getAttribute('class'),
        renderHTML: attributes => {
          if (!attributes.class) {
            return {}
          }
          return {
            class: attributes.class,
          }
        },
      }
    }
  },
}); 