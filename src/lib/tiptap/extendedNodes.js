// All extended TipTap nodes with block attributes in one place
import Paragraph from '@tiptap/extension-paragraph';
import { Heading } from '@tiptap/extension-heading';
import ListItem from '@tiptap/extension-list-item';
import BulletList from '@tiptap/extension-bullet-list';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Blockquote from '@tiptap/extension-blockquote';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import OrderedList from '@tiptap/extension-ordered-list';
import CodeBlock from '@tiptap/extension-code-block';

// Common block attributes for all extended nodes
function getBlockAttributes() {
  return {
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
    debugNew: {
      default: false,
      renderHTML: (attributes) => attributes.debugNew ? {
        'class': 'debug-new-block',
      } : {},
      parseHTML: (element) => element.classList.contains('debug-new-block'),
    },
    debugParent: {
      default: false,
      renderHTML: (attributes) => attributes.debugParent ? {
        'class': 'debug-new-block-parent',
      } : {},
      parseHTML: (element) => element.classList.contains('debug-new-block-parent'),
    },
    timelineTime: {
      default: null,
      renderHTML: (attributes) => attributes.timelineTime ? {
        'data-timeline-time': attributes.timelineTime.toISOString(),
      } : {},
      parseHTML: (element) => {
        const timeStr = element.getAttribute('data-timeline-time');
        return timeStr ? new Date(timeStr) : null;
      },
    },
  };
}

// Alternative version for extensions that use conditional rendering (like Heading)
function getBlockAttributesConditional() {
  return {
    blockId: {
      default: null,
      renderHTML: (attributes) => {
        if (!attributes.blockId) return {};
        return { 'data-block-id': attributes.blockId };
      },
      parseHTML: (element) => element.getAttribute('data-block-id'),
    },
    createdAt: {
      default: null,
      renderHTML: (attributes) => {
        if (!attributes.createdAt) return {};
        return { 'data-created-at': attributes.createdAt };
      },
      parseHTML: (element) => element.getAttribute('data-created-at'),
    },
    parentId: {
      default: null,
      renderHTML: (attributes) => {
        if (!attributes.parentId) return {};
        return { 'data-parent-id': attributes.parentId };
      },
      parseHTML: (element) => element.getAttribute('data-parent-id'),
    },
    debugNew: {
      default: false,
      renderHTML: (attributes) => {
        if (!attributes.debugNew) return {};
        return { 'class': 'debug-new-block' };
      },
      parseHTML: (element) => element.classList.contains('debug-new-block'),
    },
    debugParent: {
      default: false,
      renderHTML: (attributes) => {
        if (!attributes.debugParent) return {};
        return { 'class': 'debug-new-block-parent' };
      },
      parseHTML: (element) => element.classList.contains('debug-new-block-parent'),
    },
    timelineTime: {
      default: null,
      renderHTML: (attributes) => {
        if (!attributes.timelineTime) return {};
        return { 'data-timeline-time': attributes.timelineTime.toISOString() };
      },
      parseHTML: (element) => {
        const timeStr = element.getAttribute('data-timeline-time');
        return timeStr ? new Date(timeStr) : null;
      },
    },
  };
}

// Helper function to extend any node type with block attributes
function extendWithBlockAttributes(BaseNode, name, useConditional = false) {
  return BaseNode.extend({
    name,
    addAttributes() {
      return {
        ...this.parent?.(),
        ...(useConditional ? getBlockAttributesConditional() : getBlockAttributes()),
      };
    },
  });
}

// Create all extended node types
export const ExtendedParagraph = extendWithBlockAttributes(Paragraph, 'paragraph');
export const ExtendedHeading = extendWithBlockAttributes(Heading, 'heading', true); // Uses conditional rendering
export const ExtendedListItem = extendWithBlockAttributes(ListItem, 'listItem');
export const ExtendedBulletList = extendWithBlockAttributes(BulletList, 'bulletList');
export const ExtendedTaskItem = extendWithBlockAttributes(TaskItem, 'taskItem');
export const ExtendedTaskList = extendWithBlockAttributes(TaskList, 'taskList');
export const ExtendedBlockquote = extendWithBlockAttributes(Blockquote, 'blockquote');
export const ExtendedHorizontalRule = extendWithBlockAttributes(HorizontalRule, 'horizontalRule');
export const ExtendedOrderedList = extendWithBlockAttributes(OrderedList, 'orderedList');
export const ExtendedCodeBlock = extendWithBlockAttributes(CodeBlock, 'codeBlock'); 