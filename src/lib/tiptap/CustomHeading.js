import { Node } from '@tiptap/core';
import { mergeAttributes } from '@tiptap/core';
import { formatTime } from '$lib/utils/format';

export const CustomHeading = Node.create({
  name: 'heading',
  
  priority: 1000, // Higher priority than the default heading
  
  group: 'block',
  
  content: 'inline*',
  
  defining: true,
  
  addOptions() {
    return {
      levels: [1, 2, 3, 4, 5, 6],
      HTMLAttributes: {},
    }
  },
  
  addAttributes() {
    return {
      level: {
        default: 1,
        rendered: false,
      },
      timestamp: {
        default: null,
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
  
  parseHTML() {
    return this.options.levels
      .map((level) => ({
        tag: `h${level}`,
        attrs: { level },
      }))
  },
  
  renderHTML({ node, HTMLAttributes }) {
    const hasLevel = this.options.levels.includes(node.attrs.level)
    const level = hasLevel
      ? node.attrs.level
      : this.options.levels[0]

    return [`h${level}`, mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },
}); 