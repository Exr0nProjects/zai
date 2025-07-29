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
        const hiddenInThisTransaction = new Set(); // Track blocks hidden in this transaction
        
        doc.descendants((node, pos) => {
          if (node.attrs.blockId === blockId) {
            // Hide the target node
            const nodeContent = node.textContent || `[${node.type.name}]`;
            console.log('🙈 Hiding block:', blockId, nodeContent.substring(0, 50) + (nodeContent.length > 50 ? '...' : ''));
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, hidden: true });
            hiddenInThisTransaction.add(blockId);
            found = true;
            
            // Check if parent nodes should also be hidden
            const $pos = doc.resolve(pos);
            for (let depth = $pos.depth - 1; depth >= 0; depth--) {
              const parentNode = $pos.node(depth);
              const parentPos = $pos.start(depth) - 1;
              
              // Only consider block-level parents that have blockId
              if (parentNode.attrs && parentNode.attrs.blockId) {
                const parentContent = parentNode.textContent || `[${parentNode.type.name}]`;
                console.log(`🔍 Checking parent at depth ${depth}:`, parentNode.attrs.blockId, parentNode.type.name, parentContent.substring(0, 30) + '...');
                
                // Check if all direct children with blockId are now hidden (including those hidden in this transaction)
                let allChildrenHidden = true;
                let hasChildrenWithBlockId = false;
                let visibleChildren = [];
                
                // Check direct children only (not all descendants)
                for (let i = 0; i < parentNode.childCount; i++) {
                  const child = parentNode.child(i);
                  if (child.attrs && child.attrs.blockId) {
                    hasChildrenWithBlockId = true;
                    const childContent = child.textContent || `[${child.type.name}]`;
                    
                    // Check if child is hidden in original doc OR in this transaction
                    const isChildHidden = child.attrs.hidden || hiddenInThisTransaction.has(child.attrs.blockId);
                    
                    if (!isChildHidden) {
                      allChildrenHidden = false;
                      visibleChildren.push({
                        id: child.attrs.blockId,
                        type: child.type.name,
                        content: childContent.substring(0, 30) + (childContent.length > 30 ? '...' : '')
                      });
                    }
                  }
                }
                
                console.log(`   📊 Children analysis: hasChildren=${hasChildrenWithBlockId}, allHidden=${allChildrenHidden}, visibleCount=${visibleChildren.length}`);
                if (visibleChildren.length > 0) {
                  console.log('   👁️ Visible children preventing hiding:', visibleChildren);
                }
                
                // Only hide parent if it has children with blockId and all are hidden
                if (hasChildrenWithBlockId && allChildrenHidden && !parentNode.attrs.hidden && !hiddenInThisTransaction.has(parentNode.attrs.blockId)) {
                  console.log('🔄 Hiding parent node:', parentNode.attrs.blockId, parentNode.type.name, 'at pos:', parentPos);
                  tr.setNodeMarkup(parentPos, undefined, { ...parentNode.attrs, hidden: true });
                  hiddenInThisTransaction.add(parentNode.attrs.blockId);
                } else if (hasChildrenWithBlockId && !allChildrenHidden) {
                  console.log('🚫 NOT hiding parent - has visible children:', parentNode.attrs.blockId, parentNode.type.name);
                }
              }
            }
            
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
            // Show the target node
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, hidden: false });
            found = true;
            
            // Show any parent nodes that were hidden (since they now have visible content)
            const $pos = doc.resolve(pos);
            for (let depth = $pos.depth - 1; depth >= 0; depth--) {
              const parentNode = $pos.node(depth);
              const parentPos = $pos.start(depth) - 1;
              
              // Only consider block-level parents that have blockId and are currently hidden
              if (parentNode.attrs && parentNode.attrs.blockId && parentNode.attrs.hidden) {
                console.log('🔄 Showing parent node:', parentNode.attrs.blockId, 'at pos:', parentPos);
                tr.setNodeMarkup(parentPos, undefined, { ...parentNode.attrs, hidden: false });
              }
            }
            
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