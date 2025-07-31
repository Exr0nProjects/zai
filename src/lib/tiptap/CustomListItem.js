import { Node } from '@tiptap/core';
import { mergeAttributes } from '@tiptap/core';
import { textblockTypeInputRule } from '@tiptap/core';

// Markdown serialization support
export function serializeCustomListItem(node) {
  const { indentLevel, listType, checkboxState } = node.attrs;
  const indent = '  '.repeat(indentLevel); // 2 spaces per indent level
  
  if (listType === 'bullet') {
    return `${indent}- `;
  } else {
    // Checkbox list
    const checkbox = checkboxState === 'done' ? '[x]' : 
                    checkboxState === 'dropped' ? '[-]' : '[ ]';
    return `${indent}- ${checkbox} `;
  }
}

export function parseMarkdownListItem(line) {
  // Match pattern: optional spaces, dash, optional space, optional checkbox
  const match = line.match(/^(\s*)-\s*(\[(.)\]\s*)?/);
  if (!match) return null;
  
  const indentLevel = Math.floor(match[1].length / 2); // 2 spaces = 1 indent
  const hasCheckbox = !!match[2];
  const checkboxChar = match[3];
  
  if (hasCheckbox) {
    let checkboxState = 'todo';
    if (checkboxChar === 'x' || checkboxChar === 'X') checkboxState = 'done';
    else if (checkboxChar === '-') checkboxState = 'dropped';
    
    return {
      listType: 'checkbox',
      indentLevel,
      checkboxState,
      content: line.substring(match[0].length)
    };
  } else {
    return {
      listType: 'bullet',
      indentLevel,
      content: line.substring(match[0].length)
    };
  }
}

// Custom list item node
export const CustomListItem = Node.create({
  name: 'customListItem',
  
  group: 'block',
  
  content: 'inline*',
  
  defining: true,
  
  addAttributes() {
    return {
      // Standard block attributes (same interface as ExtendedNodes)
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
      timelineTime: {
        default: null,
        defining: true,
        renderHTML: (attributes) => ({
          'data-timeline-time': attributes.timelineTime,
        }),
        parseHTML: (element) => element.getAttribute('data-timeline-time'),
      },
      children: {
        default: [],
        renderHTML: (attributes) => ({
          'data-children': JSON.stringify(attributes.children || []),
        }),
        parseHTML: (element) => {
          try {
            return JSON.parse(element.getAttribute('data-children') || '[]');
          } catch {
            return [];
          }
        },
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
      
      // Custom list attributes
      indentLevel: {
        default: 0,
        renderHTML: (attributes) => ({
          'data-indent-level': attributes.indentLevel,
        }),
        parseHTML: (element) => parseInt(element.getAttribute('data-indent-level')) || 0,
      },
      listType: {
        default: 'bullet', // 'bullet' or 'checkbox'
        renderHTML: (attributes) => ({
          'data-list-type': attributes.listType,
        }),
        parseHTML: (element) => element.getAttribute('data-list-type') || 'bullet',
      },
      checkboxState: {
        default: 'todo', // 'todo', 'done', or 'dropped'
        renderHTML: (attributes) => ({
          'data-checkbox-state': attributes.checkboxState,
        }),
        parseHTML: (element) => element.getAttribute('data-checkbox-state') || 'todo',
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'li',
        class: 'custom-list-item',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes, node }) {
    const { indentLevel, listType, checkboxState } = node.attrs;
    const paddingLeft = indentLevel * 1.5; // 1.5rem per indent level
    
    if (listType === 'bullet') {
      // Render as bullet list item using existing CSS
      return [
        'li',
        mergeAttributes(HTMLAttributes, {
          class: 'custom-list-item',
          style: `margin-left: ${paddingLeft}rem;`,
        }),
        ['span', { class: 'list-bullet', style: 'margin-right: 0.5rem;' }, '•'],
        ['span', { class: 'list-content' }, 0],
      ];
    } else {
      // Render as task list item using existing CSS structure
      const isChecked = checkboxState === 'done';
      const isDropped = checkboxState === 'dropped';
      
      const checkboxClass = isDropped ? 'dropped' : (isChecked ? 'done' : 'todo');
      const checkboxStyle = `margin-right: 0.5rem; opacity: ${isDropped ? '0.5' : '1'};`;
      
      return [
        'li',
        mergeAttributes(HTMLAttributes, {
          class: `custom-list-item task-item ${checkboxClass}`,
          style: `margin-left: ${paddingLeft}rem;`,
        }),
        [
          'label',
          { style: 'display: flex; align-items: flex-start; width: 100%;' },
          [
            'input',
            {
              type: 'checkbox',
              checked: isChecked,
              disabled: isDropped,
              class: 'task-checkbox',
              style: checkboxStyle,
              'data-checkbox-state': checkboxState,
            }
          ],
          ['span', { class: 'list-content', style: isDropped ? 'text-decoration: line-through; opacity: 0.6;' : '' }, 0],
        ],
      ];
    }
  },
  
  addCommands() {
    return {
      setCustomListItem: (attributes = {}) => ({ commands }) => {
        return commands.setNode(this.name, attributes);
      },
      
      toggleCustomListType: () => ({ tr, state, dispatch }) => {
        const { from } = state.selection;
        const $pos = state.doc.resolve(from);
        
        // Find customListItem parent
        for (let depth = $pos.depth; depth >= 0; depth--) {
          const node = $pos.node(depth);
          if (node.type.name === this.name) {
            const newType = node.attrs.listType === 'bullet' ? 'checkbox' : 'bullet';
            const newAttrs = { 
              ...node.attrs, 
              listType: newType, 
              checkboxState: 'todo' // Reset to todo when switching to checkbox
            };
            
            if (dispatch) {
              tr.setNodeMarkup($pos.start(depth), null, newAttrs);
            }
            return true;
          }
        }
        return false;
      },
      
      toggleCheckbox: () => ({ tr, state, dispatch }) => {
        const { from } = state.selection;
        const $pos = state.doc.resolve(from);
        
        // Find customListItem parent
        for (let depth = $pos.depth; depth >= 0; depth--) {
          const node = $pos.node(depth);
          if (node.type.name === this.name && node.attrs.listType === 'checkbox') {
            // Cycle through: todo -> done -> dropped -> todo
            let newState;
            switch (node.attrs.checkboxState) {
              case 'todo':
                newState = 'done';
                break;
              case 'done':
                newState = 'dropped';
                break;
              case 'dropped':
              default:
                newState = 'todo';
                break;
            }
            
            const newAttrs = { ...node.attrs, checkboxState: newState };
            
            if (dispatch) {
              tr.setNodeMarkup($pos.start(depth), null, newAttrs);
            }
            return true;
          }
        }
        return false;
      },
      
      setCheckboxState: (state) => ({ tr, state: editorState, dispatch }) => {
        const { from } = editorState.selection;
        const $pos = editorState.doc.resolve(from);
        
        // Find customListItem parent
        for (let depth = $pos.depth; depth >= 0; depth--) {
          const node = $pos.node(depth);
          if (node.type.name === this.name && node.attrs.listType === 'checkbox') {
            const newAttrs = { ...node.attrs, checkboxState: state };
            
            if (dispatch) {
              tr.setNodeMarkup($pos.start(depth), null, newAttrs);
            }
            return true;
          }
        }
        return false;
      },
      
      indentListItem: () => ({ tr, state, dispatch }) => {
        return this.editor.commands.updateAttributes(this.name, {
          indentLevel: Math.min(this.getMaxIndentLevel(state), this.getCurrentIndentLevel(state) + 1)
        });
      },
      
      outdentListItem: () => ({ tr, state, dispatch }) => {
        return this.editor.commands.updateAttributes(this.name, {
          indentLevel: Math.max(0, this.getCurrentIndentLevel(state) - 1)
        });
      },
    };
  },
  
  addKeyboardShortcuts() {
    return {
      'Tab': () => this.editor.commands.indentListItem(),
      'Shift-Tab': () => this.editor.commands.outdentListItem(),
      'Enter': () => {
        // Create new list item with same type and indent level
        const { selection } = this.editor.state;
        const { $from } = selection;
        
        // Find customListItem parent
        for (let depth = $from.depth; depth >= 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === this.name) {
            return this.editor.commands.splitBlock({
              keepMarks: false,
            }) && this.editor.commands.setCustomListItem({
              listType: node.attrs.listType,
              indentLevel: node.attrs.indentLevel,
              checkboxState: 'todo', // Always start new items as todo
            });
          }
        }
        return false;
      },
      'Backspace': () => {
        const { selection } = this.editor.state;
        const { $from } = selection;
        
        // If at start of list item and has indent, outdent instead of deleting
        if ($from.parentOffset === 0) {
          const node = $from.parent;
          if (node.type.name === this.name && node.attrs.indentLevel > 0) {
            return this.editor.commands.outdentListItem();
          }
        }
        return false;
      },
    };
  },
  
  addInputRules() {
    return [
      // Detect bullet list pattern: spaces + dash + optional space
      textblockTypeInputRule({
        find: /^(\s*)-\s*$/,
        type: this.type,
        getAttributes: (match) => {
          const indentLevel = Math.floor(match[1].length / 2);
          return {
            listType: 'bullet',
            indentLevel,
            checkboxState: 'todo'
          };
        },
      }),
      
      // Detect checkbox list patterns: spaces + dash + optional space + checkbox + optional space
      textblockTypeInputRule({
        find: /^(\s*)-\s*\[(.)\]\s*$/,
        type: this.type,
        getAttributes: (match) => {
          const indentLevel = Math.floor(match[1].length / 2);
          const checkboxChar = match[2];
          
          let checkboxState = 'todo';
          if (checkboxChar === 'x' || checkboxChar === 'X') checkboxState = 'done';
          else if (checkboxChar === '-') checkboxState = 'dropped';
          
          return {
            listType: 'checkbox',
            indentLevel,
            checkboxState
          };
        },
      }),
    ];
  },
  
  // Helper methods
  getCurrentIndentLevel(state) {
    const { from } = state.selection;
    const $pos = state.doc.resolve(from);
    
    // Find customListItem parent
    for (let depth = $pos.depth; depth >= 0; depth--) {
      const node = $pos.node(depth);
      if (node.type.name === this.name) {
        return node.attrs.indentLevel;
      }
    }
    return 0;
  },
  
  getMaxIndentLevel(state) {
    const { from } = state.selection;
    const $pos = state.doc.resolve(from);
    
    // Find parent custom list item
    for (let depth = $pos.depth - 1; depth >= 0; depth--) {
      const parentNode = $pos.node(depth);
      if (parentNode.type.name === this.name) {
        return parentNode.attrs.indentLevel + 1;
      }
    }
    
    return 5; // Max indent level when no parent
  },
});

// CSS for custom list items
export const customListItemCSS = `
.custom-list-item {
  display: block;
  margin: 0.25rem 0;
  min-height: 1.5rem;
  position: relative;
}

.list-bullet {
  color: #666;
  font-weight: bold;
  width: 1rem;
  text-align: center;
}

.list-checkbox {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.list-content {
  margin-left: 1.5rem;
}

.custom-list-item.checked .list-content {
  text-decoration: line-through;
  opacity: 0.6;
}

/* Debug styles */
.debug-new-block.custom-list-item {
  border: 2px solid blue !important;
}

.debug-new-block-parent.custom-list-item {
  border: 2px dashed blue !important;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .list-bullet {
    color: #aaa;
  }
}
`; 