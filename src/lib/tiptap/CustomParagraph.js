import { Node } from '@tiptap/core';
import { mergeAttributes } from '@tiptap/core';

export const CustomParagraph = Node.create({
  name: 'paragraph',
  
  priority: 1000, // Higher priority than the default paragraph
  
  group: 'block',
  
  content: 'inline*',
  
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
        parseHTML: element => element.getAttribute('data-timestamp'),
        renderHTML: attributes => {
          if (!attributes.timestamp) {
            return {}
          }
          return {
            'data-timestamp': attributes.timestamp,
          }
        },
      },
      noteId: {
        default: null,
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