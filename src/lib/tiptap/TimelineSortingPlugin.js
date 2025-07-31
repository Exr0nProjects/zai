/**
 * Timeline Sorting Plugin
 * Automatically moves blocks to their chronological position
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { serializeToMarkdown } from './MarkdownClipboard';

// Global state for timeline sorting
let sortQueue = new Set(); // Queue of block IDs that need sorting
let isProcessing = false; // Prevent recursive calls
let editorView = null; // Store editor view globally

// Exported functions for queue management
export function addBlockToSortQueue(blockId) {
  if (blockId) {
    sortQueue.add(blockId);
  }
}

export function clearSortQueue() {
  sortQueue.clear();
}

// Helper function to check if the cursor is currently inside a block
function isCursorInBlock(state, blockId) {
  const $pos = state.doc.resolve(state.selection.from);
  for (let depth = $pos.depth; depth >= 0; depth--) {
    const node = $pos.node(depth);
    if (node.attrs && node.attrs.blockId === blockId) {
      return true;
    }
  }
  return false;
}

// Helper function to check if a block is leaf level (no children with blockId)
function isLeafBlock(blockInfo) {
  let hasChildrenWithBlockId = false;
  blockInfo.node.descendants((node) => {
    if (node.attrs && node.attrs.blockId && node !== blockInfo.node) {
      hasChildrenWithBlockId = true;
      return false; // Stop traversal
    }
  });
  return !hasChildrenWithBlockId;
}

// Helper function to find a block by its blockId
function findBlockById(state, blockId) {
  let foundBlock = null;
  state.doc.descendants((node, pos) => {
    if (node.isBlock && node.attrs && node.attrs.blockId === blockId) {
      foundBlock = {
        node,
        pos,
        blockId,
        timelineTime: node.attrs.timelineTime,
      };
      return false; // Stop traversal
    }
  });
  return foundBlock;
}

// Main sort function
function sortFromQueue() {
  if (!editorView || isProcessing || sortQueue.size == 0) return;
  isProcessing = true;
  try {
    const blockId = sortQueue.values().next().value;
    // console.log('performSort', blockId)
    
    const state = editorView.state;
    const blockInfo = findBlockById(state, blockId);

    if (isCursorInBlock(state, blockId)) return;  // FIX: don't consume from queue if failing bc cursor

    sortQueue.delete(blockId);

    if (!blockInfo || !blockInfo.timelineTime) return;
    if (!isLeafBlock(blockInfo)) return;

    // console.log('checking blockinfo', !!blockInfo, blockInfo.timelineTime, !isCursorInBlock(state, blockId), !isLeafBlock(blockInfo))
    // console.log('found block!', blockInfo.blockId, blockInfo, blockInfo.node.content)

    moveBlockToTimelinePosition(editorView, blockInfo);

  } finally {
    isProcessing = false;
  }
}

export const TimelineSortingPlugin = Extension.create({
  name: 'timelineSorting',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('timelineSorting'),
        
        state: {
          init: () => ({}),
          apply(tr, value, oldState, newState) {
            // Ignore our own timeline sort transactions
            if (tr.getMeta('timelineSort') || isProcessing) return value;
            
            // Add any blocks that were modified in this transaction
            if (tr.docChanged) {
              tr.steps.forEach(step => {
                if (step.from !== undefined && step.to !== undefined) {
                  // Check blocks around the modified range
                  for (let pos = Math.max(0, step.from - 1); pos <= Math.min(newState.doc.content.size, step.to + 1); pos++) {
                    try {
                      const $pos = newState.doc.resolve(pos);
                      for (let depth = $pos.depth; depth >= 0; depth--) {
                        const node = $pos.node(depth);
                        if (node.isBlock && node.attrs && node.attrs.blockId && node.attrs.timelineTime) {
                          addBlockToSortQueue(node.attrs.blockId);
                          break; // Only add the first blockId found at this position
                        }
                      }
                    } catch (e) {
                      // Ignore position errors
                    }
                  }
                }
              });
            }
            
            return value;
          }
        },
        
        view(view) {
          editorView = view;
          
          return {
            update(view, prevState) {
              // Process sort queue - each sort will trigger another update
              sortFromQueue();
            },
            
            destroy() {
              editorView = null;
              clearSortQueue();
            }
          };
        },
      })
    ];
  },
});

/**
 * Find the block containing a timestamp at the given position
 */
function findBlockWithTimestamp(state, pos) {
  const $pos = state.doc.resolve(pos);
  for (let depth = $pos.depth; depth >= 0; depth--) {
    const node = $pos.node(depth);
    if (node.isBlock && node.attrs && node.attrs.blockId && node.attrs.timelineTime) {
      return {
        node,
        pos: $pos.start(depth),
        blockId: node.attrs.blockId,
        timelineTime: node.attrs.timelineTime,
        depth
      };
    }
  }
  return null;
}

/**
 * Find the first ancestor that has siblings
 */
function firstAncestorWithSiblings(state, startPos) {
  const $pos = state.doc.resolve(startPos+1);
  console.log('firstAncestorWithSiblings', $pos.depth)
  printPositions(state.doc.content, [startPos])
  for (let depth = $pos.depth; depth >= 1; depth--) {
    const node = $pos.node(depth);
    const parent = $pos.node(depth - 1);

    if (node.isBlock && node.attrs && node.attrs.blockId) {
      if (parent.childCount > 1) {
        return {
          node,
          from: $pos.start(depth),
          to: $pos.end(depth),
          depth
        };
      } 
    }
  }
  
  const currentNode = $pos.node($pos.depth);
  if (currentNode.isBlock && currentNode.attrs && currentNode.attrs.blockId) {
    return {
      node: currentNode,
      from: $pos.start($pos.depth),
      to: $pos.end($pos.depth),
      depth: $pos.depth
    };
  }
  return null;
}

/**
 * Find where to insert a block based on timeline order
 */
function findTimelineInsertionPosition(state, timelineTime) {
  const targetDate = new Date(timelineTime);
  let insertPos = state.doc.content.size;

  console.log(state.doc.content)
  
  state.doc.descendants((node, pos, parent, index) => {
    if (parent === state.doc && node.isBlock && node.attrs) {
      if (node.attrs.timelineTime) {
        const nodeDate = new Date(node.attrs.timelineTime);
        if (nodeDate > targetDate) {
          insertPos = pos;
          return false; // Stop traversal
        }
      } else if (node.attrs.createdAt) {
        const nodeDate = node.attrs.createdAt.includes('T') 
          ? new Date(node.attrs.createdAt)
          : new Date(parseInt(node.attrs.createdAt));
        
        if (nodeDate > targetDate) {
          insertPos = pos;
          return false; // Stop traversal
        }
      }
    }
    return false; // Don't traverse into child nodes
  });
  
  return insertPos;
}

/**
 * Move a block to its chronological position in the timeline
 */
function moveBlockToTimelinePosition(view, blockInfo) {
  if (!view || !blockInfo || !blockInfo.timelineTime) return;

  const { state } = view;
  const tr = state.tr;
  console.log('moveBlockToTimelinePosition', blockInfo)
  
  const topLevelBlock = firstAncestorWithSiblings(state, blockInfo.pos);
  console.log('topLevelBlock', topLevelBlock)
  if (!topLevelBlock) return;
  
  const insertPos = findTimelineInsertionPosition(state, blockInfo.timelineTime);

  console.log('moving ', blockInfo.blockId, blockInfo.timelineTime, 'from', topLevelBlock.from, topLevelBlock.to, 'to', insertPos)
  
  // Don't move if it's already in the right position
  if (insertPos >= topLevelBlock.from && insertPos <= topLevelBlock.to) return;
  if (topLevelBlock.from >= topLevelBlock.to) return;

  const slice = state.doc.slice(topLevelBlock.from, topLevelBlock.to + 1);
  if (slice.size === 0) return;

  printPositions(state.doc.content, [topLevelBlock.from, topLevelBlock.to])
  printPositions(state.doc.content, [insertPos])
  
  if (insertPos > topLevelBlock.to) {
    tr.insert(insertPos, slice.content);
    tr.deleteRange(Math.max(topLevelBlock.from-1, 0), topLevelBlock.to);
  } else {
    tr.deleteRange(Math.max(topLevelBlock.from-1, 0), topLevelBlock.to);
    tr.insert(insertPos, slice.content);
  }
  
  // Mark this as a timeline sort to prevent other plugins from interfering
  tr.setMeta('timelineSort', true);
  tr.setMeta('preventParsing', true);
  
  view.dispatch(tr);
} 

function printPositions(content, poss) {
  const acc = Array(poss.length).fill(0)
  for (let i = 1; i < poss.length; i++) { 
    acc[i] = acc[i-1] + poss[i-1]
  }
  console.log(poss + '\n ' + serializeContentToPositions(content) + '\n' + poss.map((p, i) => ' '.repeat(p - acc[i]) + '^').join(''))
}

function serializeContentToPositions(cnt) {
  const content = cnt.content;
  const ret = content.map((node, index) => {
    if (node.type === 'text' || node.hasOwnProperty('text')) {
      return node.text
    }
    if (node.type === 'paragraph') {
      if (node.hasOwnProperty('content')) {
        return '<' + serializeContentToPositions(node.content) + '>'
      } else {
        return '<>'
      }
    }
    if (node.hasOwnProperty('content')) {
      return '<' + serializeContentToPositions(node.content) + '>'
    }
    return ''
  }).join('');
  return ret;
}