import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Extension } from '@tiptap/core';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const HiddenBlocksPluginKey = new PluginKey('hiddenBlocks');

// Helper function to skip hidden blocks during navigation
function skipHiddenBlocks(editor, direction) {
  const { state } = editor;
  const { selection, doc } = state;
  const { $from } = selection;
  
  // Get the current block
  const currentBlock = $from.node($from.depth);
  
  // Only handle if current block is actually hidden
  if (currentBlock.attrs && currentBlock.attrs.hidden) {
    let targetPos = null;
    
    doc.descendants((node, pos) => {
      if (!node.attrs.hidden && node.attrs.blockId && pos !== $from.pos) {
        if (direction === 'up' || direction === 'left') {
          if (pos < $from.pos) {
            targetPos = pos + 1; // Position cursor at start of block
          }
        } else if (direction === 'down' || direction === 'right') {
          if (pos > $from.pos && targetPos === null) {
            targetPos = pos + 1; // Position cursor at start of block
          }
        }
      }
    });
    
    if (targetPos !== null) {
      editor.commands.setTextSelection(targetPos);
      return true;
    }
  }
  
  return false; // Let default behavior handle
}

// Helper function to prevent deletion of hidden blocks
function preventHiddenBlockDeletion(editor, direction) {
  const { state } = editor;
  const { selection, doc } = state;
  const { $from, $to } = selection;
  
  // Check if we're about to delete a hidden block
  if (selection.empty) {
    const resolvedPos = direction === 'backward' ? $from : $to;
    let checkPos = direction === 'backward' ? resolvedPos.pos - 1 : resolvedPos.pos + 1;
    
    if (checkPos >= 0 && checkPos < doc.content.size) {
      const targetNode = doc.nodeAt(checkPos);
      if (targetNode && targetNode.attrs && targetNode.attrs.hidden) {
        return true; // Prevent deletion
      }
    }
  } else {
    // Check if selection includes hidden blocks
    let hasHiddenInSelection = false;
    doc.nodesBetween($from.pos, $to.pos, (node) => {
      if (node.attrs && node.attrs.hidden) {
        hasHiddenInSelection = true;
        return false; // Stop searching
      }
    });
    if (hasHiddenInSelection) {
      return true; // Prevent deletion
    }
  }
  
  return false; // Allow default behavior
}

export const HiddenBlocksPlugin = Extension.create({
  name: 'hiddenBlocks',

  addGlobalAttributes() {
    return [
      {
        types: [
          'paragraph', 'heading', 'bulletList', 'taskList', 'orderedList', 
          'listItem', 'taskItem', 'blockquote', 'codeBlock', 'horizontalRule'
        ],
        attributes: {
          hidden: {
            default: false,
            renderHTML: attributes => attributes.hidden ? { 'data-hidden': 'true' } : {},
            parseHTML: element => element.getAttribute('data-hidden') === 'true',
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      hideBlock: (blockId) => ({ tr, dispatch }) => {
        if (!dispatch) return false;
        
        const { doc } = tr;
        let found = false;
        
        doc.descendants((node, pos) => {
          if (node.attrs.blockId === blockId) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, hidden: true });
            found = true;
            return false; // Stop traversing
          }
        });
        
        return found;
      },
      
      showBlock: (blockId) => ({ tr, dispatch }) => {
        if (!dispatch) return false;
        
        const { doc } = tr;
        let found = false;
        
        doc.descendants((node, pos) => {
          if (node.attrs.blockId === blockId) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, hidden: false });
            found = true;
            return false; // Stop traversing
          }
        });
        
        return found;
      },
      
      toggleBlockVisibility: (blockId) => ({ tr, dispatch, state }) => {
        if (!dispatch) return false;
        
        const { doc } = tr;
        let found = false;
        
        doc.descendants((node, pos) => {
          if (node.attrs.blockId === blockId) {
            const isHidden = node.attrs.hidden;
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, hidden: !isHidden });
            found = true;
            return false; // Stop traversing
          }
        });
        
        return found;
      },
      
      hideAllBlocks: () => ({ tr, dispatch }) => {
        if (!dispatch) return false;
        
        const { doc } = tr;
        let modified = false;
        
        doc.descendants((node, pos) => {
          if (node.attrs.blockId && !node.attrs.hidden) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, hidden: true });
            modified = true;
          }
        });
        
        return modified;
      },
      
      showAllBlocks: () => ({ tr, dispatch }) => {
        if (!dispatch) return false;
        
        const { doc } = tr;
        let modified = false;
        
        doc.descendants((node, pos) => {
          if (node.attrs.blockId && node.attrs.hidden) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, hidden: false });
            modified = true;
          }
        });
        
        return modified;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      ArrowUp: ({ editor }) => {
        return skipHiddenBlocks(editor, 'up');
      },
      ArrowDown: ({ editor }) => {
        return skipHiddenBlocks(editor, 'down');
      },
      ArrowLeft: ({ editor }) => {
        return skipHiddenBlocks(editor, 'left');
      },
      ArrowRight: ({ editor }) => {
        return skipHiddenBlocks(editor, 'right');
      },
      Backspace: ({ editor }) => {
        return preventHiddenBlockDeletion(editor, 'backward');
      },
      Delete: ({ editor }) => {
        return preventHiddenBlockDeletion(editor, 'forward');
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: HiddenBlocksPluginKey,
        
        props: {
          decorations: (state) => {
            const decorations = [];
            const { doc } = state;
            
            doc.descendants((node, pos) => {
              if (node.attrs.hidden) {
                decorations.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    class: 'hidden-block',
                  })
                );
              }
            });
            
            return DecorationSet.create(doc, decorations);
          },
          
          // Prevent selection of hidden blocks
          handleClick: (view, pos, event) => {
            const { doc } = view.state;
            const resolvedPos = doc.resolve(pos);
            
            // Check if click is within a hidden block
            for (let depth = resolvedPos.depth; depth >= 0; depth--) {
              const node = resolvedPos.node(depth);
              if (node.attrs.hidden) {
                event.preventDefault();
                return true; // Handled
              }
            }
            
            return false; // Not handled
          },
          
          // Prevent hidden blocks from being included in selections
          handleDOMEvents: {
            selectstart: (view, event) => {
              const selection = window.getSelection();
              if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const startContainer = range.startContainer;
                const endContainer = range.endContainer;
                
                // Check if selection includes hidden blocks
                const hiddenElements = view.dom.querySelectorAll('[data-hidden="true"]');
                for (const hiddenEl of hiddenElements) {
                  if (hiddenEl.contains(startContainer) || hiddenEl.contains(endContainer)) {
                    event.preventDefault();
                    return true;
                  }
                }
              }
              return false;
            },
          },
        },
      }),
    ];
  },

}); 