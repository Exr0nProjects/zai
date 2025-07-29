import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Extension } from '@tiptap/core';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { get } from 'svelte/store';
import { searchHiddenBlocks } from '../stores/searchHidden.js';

const HiddenBlocksPluginKey = new PluginKey('hiddenBlocks');

// Helper function to check if a block is hidden during search
function isBlockHidden(blockId) {
  const hiddenSet = get(searchHiddenBlocks);
  return hiddenSet.has(blockId);
}

// Helper function to find block ID from a position
function getBlockIdFromPos(doc, pos) {
  const $pos = doc.resolve(pos);
  for (let depth = $pos.depth; depth >= 0; depth--) {
    const node = $pos.node(depth);
    if (node.attrs && node.attrs.blockId) {
      return node.attrs.blockId;
    }
  }
  return null;
}

// Helper function to skip hidden blocks during navigation
function skipHiddenBlocks(editor, direction) {
  const { state } = editor;
  const { selection, doc } = state;
  const { $from } = selection;
  
  // Get the current block ID
  const currentBlockId = getBlockIdFromPos(doc, $from.pos);
  
  // Only handle if current block is actually hidden
  if (currentBlockId && isBlockHidden(currentBlockId)) {
    let targetPos = null;
    
    doc.descendants((node, pos) => {
      if (node.attrs && node.attrs.blockId && !isBlockHidden(node.attrs.blockId) && pos !== $from.pos) {
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
      const blockId = getBlockIdFromPos(doc, checkPos);
      if (blockId && isBlockHidden(blockId)) {
        return true; // Prevent deletion
      }
    }
  } else {
    // Check if selection includes hidden blocks
    let hasHiddenInSelection = false;
    doc.nodesBetween($from.pos, $to.pos, (node) => {
      if (node.attrs && node.attrs.blockId && isBlockHidden(node.attrs.blockId)) {
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
          // Apply decorations based on search store
          decorations: (state) => {
            const decorations = [];
            const { doc } = state;
            const hiddenSet = get(searchHiddenBlocks);
            
            doc.descendants((node, pos) => {
              if (node.attrs && node.attrs.blockId && hiddenSet.has(node.attrs.blockId)) {
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
            const blockId = getBlockIdFromPos(view.state.doc, pos);
            if (blockId && isBlockHidden(blockId)) {
              event.preventDefault();
              return true; // Handled
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
                
                // Check if selection includes hidden blocks by checking CSS class
                const hiddenElements = view.dom.querySelectorAll('.hidden-block');
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