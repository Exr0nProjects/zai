import { mergeAttributes, textblockTypeInputRule } from '@tiptap/core';
import Paragraph from '@tiptap/extension-paragraph';

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

// Helper functions outside the node definition
function getCurrentIndentLevel(state, nodeName) {
  const { from } = state.selection;
  const $pos = state.doc.resolve(from);
  
  // Find customListItem parent
  for (let depth = $pos.depth; depth >= 0; depth--) {
    const node = $pos.node(depth);
    if (node.type.name === nodeName) {
      return node.attrs.indentLevel;
    }
  }
  return 0;
}

function getMaxIndentLevel(state, nodeName) {
  const { from } = state.selection;
  const $pos = state.doc.resolve(from);
  
  // Find current node's blockId to exclude it
  let currentBlockId = null;
  for (let depth = $pos.depth; depth >= 0; depth--) {
    const node = $pos.node(depth);
    if (node.type.name === nodeName) {
      currentBlockId = node.attrs.blockId;
      break;
    }
  }
  
  // Find the most recent list item before current (at any indent level)
  let mostRecentIndentLevel = -1;
  
  state.doc.nodesBetween(0, $pos.pos + 1, (node, pos) => {
    if (node.type.name === nodeName) {
      // If we found the current node, stop looking
      if (node.attrs.blockId === currentBlockId) {
        return false; // Break out of nodesBetween
      }
      
      // Track the most recent list item's indent level
      mostRecentIndentLevel = node.attrs.indentLevel || 0;
    }
  });
  
  // Allow indenting one level deeper than the most recent list item
  return mostRecentIndentLevel + 1;
}

// Global helper function to find new parent ID
function findNewParentId(state, currentPos, targetParentIndentLevel, nodeName, currentBlockId) {
  let newParentId = null;
  
  // Look backwards from start of document until we find ourselves
  state.doc.nodesBetween(0, currentPos + 1, (node, pos) => {
    if (node.type.name === nodeName) {
      // If we found the current node, stop looking
      if (node.attrs.blockId === currentBlockId) {
        return false; // Break out of nodesBetween
      }
      
      const nodeIndentLevel = node.attrs.indentLevel || 0;
      
      // Find the most recent list item at the target parent indent level
      if (nodeIndentLevel <= targetParentIndentLevel) {
        newParentId = node.attrs.blockId;
      }
    }
  });
  
  return newParentId;
}

// Custom list item node extending Paragraph
export const CustomListItem = Paragraph.extend({
  name: 'customListItem',
  
  addAttributes() {
    return {
      ...this.parent?.(),
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
        tag: 'p',
        class: 'custom-list-item',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes, node }) {
    const { indentLevel, listType, checkboxState } = node.attrs;
    const paddingLeft = indentLevel * 1.25;
    
    // Build CSS classes for styling via ::before
    const classes = ['custom-list-item'];
    
    if (listType === 'bullet') {
      classes.push('custom-bullet');
    } else {
      classes.push('custom-checkbox');
      if (checkboxState === 'done') classes.push('checked');
      if (checkboxState === 'dropped') classes.push('dropped');
    }
    
    return [
      'p',
      mergeAttributes(HTMLAttributes, {
        class: classes.join(' '),
        style: `margin-left: ${paddingLeft}rem;`,
        'data-list-type': listType,
        'data-checkbox-state': checkboxState,
        'data-indent-level': indentLevel,
      }),
      0,
    ];
  },
  

  
  addCommands() {
    return {
      setCustomListItem: (attributes = {}) => ({ commands }) => {
        return commands.setNode(this.name, attributes);
      },
      
      indentCustomListItem: () => ({ tr, state, dispatch }) => {
        const { from } = state.selection;
        const $pos = state.doc.resolve(from);
        
        // Find customListItem parent
        for (let depth = $pos.depth; depth >= 0; depth--) {
          const node = $pos.node(depth);
          if (node.type.name === this.name) {
            const currentIndent = node.attrs.indentLevel || 0;
            const maxIndent = getMaxIndentLevel(state, this.name);
            const newIndent = Math.min(maxIndent, currentIndent + 1);
            
            if (newIndent !== currentIndent) {
              // Find the new parent (previous list item at the target indent level)
              const newParentId = findNewParentId(state, $pos.pos, newIndent - 1, this.name, node.attrs.blockId);
              
              if (dispatch) {
                tr.setNodeMarkup($pos.before(depth), null, { 
                  ...node.attrs, 
                  indentLevel: newIndent,
                  parentId: newParentId
                });
              }
              return true;
            }
            return true;  // prevent default
          }
        }
        return true;
      },
      
      outdentCustomListItem: () => ({ tr, state, dispatch }) => {
        const { from } = state.selection;
        const $pos = state.doc.resolve(from);
        
        // Find customListItem parent
        for (let depth = $pos.depth; depth >= 0; depth--) {
          const node = $pos.node(depth);
          if (node.type.name === this.name) {
            const currentIndent = node.attrs.indentLevel || 0;
            const newIndent = Math.max(0, currentIndent - 1);
            
            if (newIndent !== currentIndent) {
              // Find the new parent (previous list item at the target indent level)
              const newParentId = newIndent === 0 ? null : findNewParentId(state, $pos.pos, newIndent - 1, this.name, node.attrs.blockId);
              
              if (dispatch) {
                tr.setNodeMarkup($pos.before(depth), null, { 
                  ...node.attrs, 
                  indentLevel: newIndent,
                  parentId: newParentId
                });
              }
              return true;
            }
            return true;  // prevent default
          }
        }
        return true;
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
              tr.setNodeMarkup($pos.before(depth), null, newAttrs);
            }
            return true;
          }
        }
        return false;
      },
      
      toggleCheckbox: () => ({ tr, state, dispatch }) => {
        const { from } = state.selection;
        const $pos = state.doc.resolve(from);

        console.log('togglecheckbox')
        
        // Find customListItem parent
        for (let depth = $pos.depth; depth >= 0; depth--) {
          const node = $pos.node(depth);
          
          if (node.type.name === this.name) {
            let newAttrs;
            
            if (node.attrs.listType === 'checkbox') {
              // Cycle through: todo -> done -> dropped -> bullet
              switch (node.attrs.checkboxState) {
                case 'todo':
                  newAttrs = { ...node.attrs, checkboxState: 'done' };
                  break;
                case 'done':
                  newAttrs = { ...node.attrs, checkboxState: 'dropped' };
                  break;
                case 'dropped':
                default:
                  // dropped -> bullet list
                  newAttrs = { ...node.attrs, listType: 'bullet', checkboxState: null };
                  break;
              }
            } else if (node.attrs.listType === 'bullet') {
              // bullet -> todo
              newAttrs = { ...node.attrs, listType: 'checkbox', checkboxState: 'todo' };
            } else {
              // fallback: convert to todo checkbox
              newAttrs = { ...node.attrs, listType: 'checkbox', checkboxState: 'todo' };
            }
            
            console.log('Checkbox/list state changed:', node.attrs.listType, node.attrs.checkboxState, '->', newAttrs.listType, newAttrs.checkboxState);
            
            if (dispatch) {
              tr.setNodeMarkup($pos.before(depth), null, newAttrs);
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
              tr.setNodeMarkup($pos.before(depth), null, newAttrs);
            }
            return true;
          }
        }
        return false;
      },
    };
  },
  
  addKeyboardShortcuts() {
    return {
      'Tab': () => {
        // Only apply if we're in a customListItem
        const { selection } = this.editor.state;
        const { $from } = selection;
        
        for (let depth = $from.depth; depth >= 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === this.name) {
            return this.editor.commands.indentCustomListItem();
          }
        }
        return false;
      },
      'Shift-Tab': () => {
        // Only apply if we're in a customListItem
        const { selection } = this.editor.state;
        const { $from } = selection;
        
        for (let depth = $from.depth; depth >= 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === this.name) {
            return this.editor.commands.outdentCustomListItem();
          }
        }
        return false;
      },
      'Enter': () => {
        const { selection } = this.editor.state;
        const { $from } = selection;
        
        // Find customListItem parent
        for (let depth = $from.depth; depth >= 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === this.name) {
            // Check if the list item is empty (no content or just whitespace)
            const isEmpty = !node.textContent.trim();
            
            if (isEmpty) {
              // On empty list item, unindent or convert to paragraph like Backspace
              if (node.attrs.indentLevel > 0) {
                // Unindent if has indent
                const { tr } = this.editor.state;
                tr.setNodeMarkup($from.before(depth), null, { ...node.attrs, indentLevel: node.attrs.indentLevel - 1 });
                this.editor.view.dispatch(tr);
                return true;
              } else {
                // Convert to paragraph if at top level
                return this.editor.commands.setParagraph();
              }
            } else {
              // Create new list item with same type and indent level
              return this.editor.commands.splitBlock({
                keepMarks: false,
              }) && this.editor.commands.setCustomListItem({
                listType: node.attrs.listType,
                indentLevel: node.attrs.indentLevel,
                checkboxState: 'todo', // Always start new items as todo
              });
            }
          }
        }
        return false;
      },
      'Backspace': () => {
        const { selection } = this.editor.state;
        const { $from } = selection;
        
        // Only apply if at start of list item
        if ($from.parentOffset === 0) {
          for (let depth = $from.depth; depth >= 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === this.name) {
              if (node.attrs.indentLevel > 0) {
                // Outdent if has indent
                const { tr } = this.editor.state;
                tr.setNodeMarkup($from.before(depth), null, { ...node.attrs, indentLevel: node.attrs.indentLevel - 1 });
                this.editor.view.dispatch(tr);
                return true;
              } else {
                // Convert to paragraph if at top level
                return this.editor.commands.setParagraph();
              }
            }
          }
        }
                return false;
      },
      'Mod-Enter': () => {
        // Toggle checkbox on Cmd/Ctrl+Enter
        const { selection } = this.editor.state;
        const { $from } = selection;
        
        for (let depth = $from.depth; depth >= 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === this.name && (node.attrs.listType === 'checkbox' || node.attrs.listType === 'bullet')) {
            return this.editor.commands.toggleCheckbox();
          }
        }
        return false;
      },
      'Control-Enter': () => {
        // Toggle checkbox on Cmd/Ctrl+Enter
        const { selection } = this.editor.state;
        const { $from } = selection;
        
        for (let depth = $from.depth; depth >= 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === this.name && (node.attrs.listType === 'checkbox' || node.attrs.listType === 'bullet')) {
            return this.editor.commands.toggleCheckbox();
          }
        }
        return false;
      },
    };
  },
  
  addDOMEventListeners() {
    return {
      click: (view, event) => {
        const target = event.target;
        console.log('click event on:', target.className);
        
        // Check if click is on a custom checkbox item or any checkbox/bullet item
        if (target.classList.contains('custom-checkbox') || target.classList.contains('custom-bullet')) {
          // Check if click is in the left margin area (where pseudo-element is)
          const rect = target.getBoundingClientRect();
          const clickX = event.clientX - rect.left;
          
          console.log('List item click detected at x:', clickX, 'on element with classes:', target.className);
          
          // If click is in the pseudo-element area (roughly 0 to 1.25rem from left edge)
          if (clickX >= 0 && clickX <= 24) { // 0 to 1.5rem ≈ 0px to 24px
            event.preventDefault();
            event.stopPropagation();
            console.log('Calling toggleCheckbox command for list item click');
            
            // Get the toggle command and execute it directly
            const toggleCommand = this.editor.commands.toggleCheckbox;
            if (toggleCommand) {
              const result = toggleCommand();
              console.log('toggleCheckbox result:', result);
              return result;
            }
            return true;
          }
        }
        return false;
      },
    };
  },
  
  addInputRules() {
    return [
      // Detect bullet list pattern: spaces + dash + space
      textblockTypeInputRule({
        find: /^(\s*)- $/,
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
});

 