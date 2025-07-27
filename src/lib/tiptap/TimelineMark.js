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
      'data-timeline': '',
      class: 'timeline-marker relative inline-block w-full border-t-2 border-blue-500 my-2',
      style: 'position: relative;'
    }, [
      'span',
      {
        class: 'absolute -top-2 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-full',
        style: 'transform: translateY(-50%);'
      },
      'Now'
    ]];
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