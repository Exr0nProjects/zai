/**
 * Timeline Sorting Plugin
 * Automatically moves blocks to their chronological position when cursor leaves them
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { serializeToMarkdown } from './MarkdownClipboard';

export const TimelineSortingPlugin = Extension.create({
  name: 'timelineSorting',

  addOptions() {
    return {
      enabled: true,
      debugMode: false,
    };
  },

  addProseMirrorPlugins() {
    // Shared state in closure
    let editorView = null;
    let pendingSort = null;
    let isProcessing = false; // Prevent recursive calls
    
    const performSort = (blockToMove, shouldScroll) => {
      if (!editorView || !blockToMove || !blockToMove.timelineTime || isProcessing) return;
      
      console.log('🕒 Performing timeline sort for block:', blockToMove.blockId, blockToMove.node.type.name, blockToMove.node.content);
      isProcessing = true;
      
      try {
        moveBlockToTimelinePosition(editorView, blockToMove, shouldScroll);
      } finally {
        // Clear processing flag after a delay to allow transaction to complete
        setTimeout(() => {
          isProcessing = false;
        }, 100);
      }
    };
    
    return [
      new Plugin({
        key: new PluginKey('timelineSorting'),
        
        state: {
          init() {
            return {
              lastBlockWithTimestamp: null,
              pendingSortId: null,
            };
          },
          
          apply(tr, value, oldState, newState) {
            // Ignore our own timeline sort transactions
            if (tr.getMeta('timelineSort') || isProcessing) {
              return value;
            }
            
            const currentBlock = findBlockWithTimestamp(newState, newState.selection.from);
            // Check if we moved out of a timestamped block
            if (value.lastBlockWithTimestamp && 
                (!currentBlock || currentBlock.blockId !== value.lastBlockWithTimestamp.blockId)) {
              
              // Only set pending sort if we have a valid timestamp and aren't already processing
              if (!pendingSort && value.lastBlockWithTimestamp.timelineTime) {
                console.log('set pendingsort', value.lastBlockWithTimestamp, serializeToMarkdown(value.lastBlockWithTimestamp.node), tr)
                // console.log(' ' + serializeContentToPositions(view.state.doc.toJSON().content) + '\n' + ' '.repeat(topLevelBlock.from) + '^' + ' '.repeat(topLevelBlock.to-topLevelBlock.from) + '^')
                pendingSort = { 
                  block: value.lastBlockWithTimestamp, 
                  shouldScroll: false 
                };
              } else if (!value.lastBlockWithTimestamp.timelineTime) {
                console.log('⚠️ Skipping sort - no timestamp for block:', value.lastBlockWithTimestamp.blockId);
              }
              
              return {
                lastBlockWithTimestamp: currentBlock,
                pendingSortId: value.lastBlockWithTimestamp.blockId,
              };
            }

            if (value.lastBlockWithTimestamp === null) {
              return {
                lastBlockWithTimestamp: currentBlock,
                pendingSortId: null,
              };
            }
            
            return value; // do nothing. can't just set to currentBlock because new-line transactions temporarily have duplicated ids. TODO: do we need to clear pendingSort? 
            // return {
            //   lastBlockWithTimestamp: currentBlock,
            //   pendingSortId: null,
            // };
          }
        },
        
        view(view) {
          // Store the view reference in closure
          editorView = view;
          
          return {
            update(view, prevState) {
              // Check for pending sorts
              if (pendingSort && !isProcessing) {
                
                // Capture and clear pendingSort immediately to prevent race conditions
                const sortToProcess = pendingSort;
                pendingSort = null;
                
                setTimeout(() => {
                  performSort(sortToProcess.block, sortToProcess.shouldScroll);
                }, 50);
              }
            },
            
            destroy() {
              editorView = null;
            }
          };
        },
        
        props: {
          handleDOMEvents: {
            blur(view, event) {
              if (isProcessing) return false; // Don't process blur during sort
              
              const state = view.state;
              const pluginState = this.getState(state);
              
              if (pluginState && pluginState.lastBlockWithTimestamp) {
                const blockToSort = pluginState.lastBlockWithTimestamp;
                setTimeout(() => {
                  performSort(blockToSort, true);
                }, 50);
              }
              return false;
            },
          },
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
  
  // Traverse upwards to find a block with both blockId and timelineTime
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
  const $pos = state.doc.resolve(startPos);
  let highestBlock = null;
  console.log('firstAncestorWithSiblings', $pos.depth, $pos.node(0).type.name)
  
  // Start from the current block and go up
  for (let depth = $pos.depth; depth >= 1; depth--) {
    const node = $pos.node(depth);
    const parent = $pos.node(depth - 1);

    if (node.isBlock && node.attrs && node.attrs.blockId) {
      const parentChildCount = parent.childCount;
      console.log('   ', depth, node.type.name, 'has blockid. parent childcount:', parentChildCount, parent.type.name, serializeToMarkdown(parent));
      
      if (parentChildCount > 1) {
        console.log('   has siblings. returning', node.type.name, serializeToMarkdown(node));
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
    highestBlock = {
      node: currentNode,
      from: $pos.start($pos.depth),
      to: $pos.end($pos.depth),
      depth: $pos.depth
    };
  }
}

/**
 * Find where to insert a block based on timeline order
 */
function findTimelineInsertionPosition(state, timelineTime) {
  const targetDate = new Date(timelineTime);
  let insertPos = state.doc.content.size-1; // Default to end // TODO: added -1 to stop inserting new paragraph
  
  // Traverse top-level blocks to find insertion point
  state.doc.descendants((node, pos, parent, index) => {
    // Only check top-level blocks (depth 1)
    if (parent === state.doc && node.isBlock && node.attrs) {
      if (node.attrs.timelineTime) {
        const nodeDate = new Date(node.attrs.timelineTime);
        
        // If this block's time is greater than our target, insert before it
        if (nodeDate > targetDate) {
          insertPos = pos;
          return false; // Stop traversal
        }
      } else if (node.attrs.createdAt) {
        console.warn('found block with no timelineTime. using createdAt:', node.id, serializeToMarkdown(node));
        // Fallback to createdAt
        const nodeDate = node.attrs.createdAt.includes('T') 
          ? new Date(node.attrs.createdAt)
          : new Date(parseInt(node.attrs.createdAt));
        
        if (nodeDate > targetDate) {
          insertPos = pos;
          return false; // Stop traversal
        }
      }
    }
    
    // Don't traverse into child nodes
    return false;
  });
  
  return insertPos;
}

/**
 * function that takes the content json and serializes into positions. inserts <> to represent open/close blocks
 */
function serializeContentToPositions(content) {
  const ret = content.map((node, index) => {
    if (node.type === 'text') {
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

/**
 * Move a block to its chronological position in the timeline
 */
function moveBlockToTimelinePosition(view, blockInfo, shouldScroll) {
  if (!view || !blockInfo || !blockInfo.timelineTime) {
    console.warn('🕒 Timeline sort: Invalid view or block info', { view, blockInfo });
    return;
  }

  console.log('\n\n\n\n docjson\n', view.state.doc.toJSON().content)
  console.log(' ' + serializeContentToPositions(view.state.doc.toJSON().content) + '\n' + ' '.repeat(blockInfo.pos) + '^' )
  
  
  const { state } = view;
  const tr = state.tr;

  console.log('blockInfo searching', blockInfo)
  
  // Find the highest ancestor with no siblings
  const topLevelBlock = firstAncestorWithSiblings(state, blockInfo.pos);
  if (!topLevelBlock) return;
  
  console.log('🕒 Found top-level block to move:', 
    'topLevelBlock', topLevelBlock,
    'nodeType', topLevelBlock.node.type.name,
    'hasContent', topLevelBlock.node.content.size > 0,
    'nodeContent', serializeToMarkdown(topLevelBlock.node) || '[no text]',
    'rangeSize', topLevelBlock.to - topLevelBlock.from
  );
  

  // Find the correct insertion position in timeline order
  const insertPos = findTimelineInsertionPosition(state, blockInfo.timelineTime);
  console.log('🕒 Insert position:', insertPos);
  
  
  // Don't move if it's already in the right position
  if (insertPos >= topLevelBlock.from && insertPos <= topLevelBlock.to) {
    return;
  }
  
  // Check if we have a valid block to move
  if (topLevelBlock.from >= topLevelBlock.to) {
    return;
  }


  // Use proper ProseMirror replaceRange to move content with attributes preserved
  const slice = state.doc.slice(topLevelBlock.from, topLevelBlock.to+1);
  
  console.log('slice', slice)

  // Skip if there's no content to move
  if (slice.size === 0) {
    return;
  }
  
  let finalInsertPos;

  console.log('deleting')
  console.log(' ' + serializeContentToPositions(view.state.doc.toJSON().content) + '\n' + ' '.repeat(topLevelBlock.from) + '^' + ' '.repeat(topLevelBlock.to-topLevelBlock.from) + '^')
  tr.deleteRange(topLevelBlock.from, topLevelBlock.to);
  
  
  // if (insertPos < topLevelBlock.from) {
  //   // Moving earlier: insert at new position, then delete original
  //   tr.replaceRange(insertPos, insertPos, slice);
  //   tr.delete(topLevelBlock.from + slice.size, topLevelBlock.to + slice.size + 1);
  //   finalInsertPos = insertPos;
  // } else {
  //   // Moving later: delete original, then insert at adjusted position  
  //   tr.delete(topLevelBlock.from, topLevelBlock.to + 1);
  //   finalInsertPos = insertPos - (topLevelBlock.to - topLevelBlock.from);
  //   tr.replaceRange(finalInsertPos, finalInsertPos, slice);
  // }
  
  // Mark this as a timeline sort to prevent other plugins from interfering
  tr.setMeta('timelineSort', true);
  tr.setMeta('preventParsing', true); // Also prevent pattern parsing
  
  // Apply the transaction
  view.dispatch(tr);
  
  if (shouldScroll) {
    // Scroll to the new position after a brief delay
    setTimeout(() => {
      const newPos = finalInsertPos + Math.floor((topLevelBlock.to - topLevelBlock.from) / 2);
      
      // Create new selection at the moved position
      const newSelection = view.state.selection.constructor.near(
        view.state.doc.resolve(Math.min(newPos, view.state.doc.content.size - 1))
      );
      
      view.dispatch(view.state.tr.setSelection(newSelection));
      
      // Scroll the new position into view
      const coords = view.coordsAtPos(newPos);
      if (coords) {
        window.scrollTo({
          top: coords.top + window.scrollY - window.innerHeight / 3,
          behavior: 'smooth'
        });
      }
    }, 100);
}
} 