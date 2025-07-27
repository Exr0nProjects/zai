import { Mark } from '@tiptap/core';

export const TimelineMark = Mark.create({
  name: 'timeline',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-timeline]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', {
      ...HTMLAttributes,
      'data-timeline': 'true',
      class: 'timeline-marker'
    }, 0];
  },

  addCommands() {
    return {
      setTimeline: () => ({ commands }) => {
        return commands.setMark(this.name);
      },
      unsetTimeline: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
}); 