import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { generateBlockId, getCurrentTimestamp } from '../utils/snowflake.js';

const LOG = false;

// Helper function to find parent blockId with temporary ID lookup
function getParentId(doc, pos, tempIdMap = new Map(), returnSelf = false) {
  // LLM: find previous sibling, or parent (if none), and use that blockId as oldBlockId 
  try {
    const resolved = doc.resolve(pos);
    
    // If returnSelf is true and current node has blockId, return it
    if (returnSelf) {
      // Check temp map first, then document
      if (tempIdMap.has(pos)) {
        const tempId = tempIdMap.get(pos);
        if (LOG) console.log(`🔗 Returning self blockId from temp map: ${tempId.slice(-8)}`);
        return tempId;
      }
      
      const currentNode = resolved.nodeAfter || resolved.parent.child(resolved.index());
      if (currentNode && currentNode.attrs && currentNode.attrs.blockId) {
        if (LOG) console.log(`🔗 Returning self blockId: ${currentNode.attrs.blockId.slice(-8)}`);
        return currentNode.attrs.blockId;
      }
    }
    
    // While loop to find previous sibling (return the first one you find)
    const parent = resolved.parent;
    const index = resolved.index();
    
    if (LOG) console.log(`🔍 Looking for previous sibling at pos ${pos}, depth ${resolved.depth}, index ${index}, parent has ${parent.childCount} children`);
    
    let siblingIndex = index - 1;
    while (siblingIndex >= 0) {
      // Calculate sibling position for temp map lookup
      let siblingPos = 0;
      if (resolved.depth > 0) {
        // For nested nodes, calculate position with parent offset
        for (let i = 0; i < siblingIndex; i++) {
          siblingPos += parent.child(i).nodeSize;
        }
        siblingPos += resolved.before(resolved.depth) + 1; // Add parent offset
      } else {
        // For top-level nodes, position is just sum of previous siblings
        for (let i = 0; i < siblingIndex; i++) {
          siblingPos += parent.child(i).nodeSize;
        }
        siblingPos += 1; // Add 1 for document start
      }
      
      // Check temp map first
      if (tempIdMap.has(siblingPos)) {
        const tempId = tempIdMap.get(siblingPos);
        if (LOG) console.log(`🔗 Found previous sibling blockId from temp map: ${tempId.slice(-8)} at index ${siblingIndex} (pos ${siblingPos})`);
        return tempId;
      }
      
      // Then check document
      const sibling = parent.child(siblingIndex);
      if (sibling && sibling.attrs && sibling.attrs.blockId) {
        if (LOG) console.log(`🔗 Found previous sibling blockId: ${sibling.attrs.blockId.slice(-8)} at index ${siblingIndex}`);
        return sibling.attrs.blockId;
      }
      siblingIndex--;
    }
    
    // Special case for top-level nodes: don't try to recurse to parent (doesn't exist)
    if (resolved.depth === 0) {
      if (LOG) console.log(`🔗 Top-level node with no previous siblings, returning null`);
      return null;
    }
    
    // If not found and not at top level, recurse with parent
    if (resolved.depth > 0) {
      const parentPos = resolved.before();
      if (LOG) console.log(`🔗 No sibling found, recursing to parent at pos ${parentPos}`);
      return getParentId(doc, parentPos, tempIdMap, true);
    }
    
    // If at root, return null
    if (LOG) console.log(`🔗 Reached root, no blockId found`);
    return null;
    
  } catch (e) {
    console.warn(`⚠️ Error in getParentId:`, e.message);
    return null;
  }
}

export const TimestampPlugin = Extension.create({
  name: 'timestampPlugin',
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('timestampPlugin'),
        
        appendTransaction(transactions, oldState, newState) {
          // Only run if there were changes
          const docChanged = transactions.some(tr => tr.docChanged);
          if (!docChanged) return null;
          
          // Skip processing for timeline sort transactions
          const isTimelineSort = transactions.some(tr => tr.getMeta('timelineSort'));
          if (isTimelineSort) {
            if (LOG) console.log('🕒 TimestampPlugin skipping timeline sort transaction');
            return null;
          }
          
          let tr = null;
          const targetNodeTypes = ['paragraph', 'heading', 'listItem', 'taskItem', 'bulletList', 'taskList'];
          const debugMode = window.debugNewBlocks || false;

          // Track seen blockIds to detect duplicates
          const seenBlockIds = new Set();
          const nodesToUpdate = [];

          // First pass: identify all nodes and detect duplicates
          newState.doc.descendants((node, pos) => {
            if (targetNodeTypes.includes(node.type.name)) {
              
              // Always assign IDs to nodes without blockId
              if (!node.attrs.blockId) {
                if (LOG) console.log('🕒 TimestampPlugin found block without blockId:', node.type.name, 'at pos:', pos);
                nodesToUpdate.push({
                  pos,
                  node,
                  reason: 'missing-id',
                  oldBlockId: null, // Will be calculated in second pass with temp map
                  newBlockId: generateBlockId(),
                  newTimestamp: getCurrentTimestamp()
                });
              } else {
                // Check for duplicate blockIds
                if (seenBlockIds.has(node.attrs.blockId)) {
                  nodesToUpdate.push({
                    pos,
                    node,
                    reason: 'duplicate-id',
                    oldBlockId: node.attrs.blockId,
                    newBlockId: generateBlockId(),
                    newTimestamp: getCurrentTimestamp()
                  });
                } else {
                  seenBlockIds.add(node.attrs.blockId);
                }
              }
            }
          });

          // Second pass: apply updates if any were needed
          if (nodesToUpdate.length > 0) {
            tr = newState.tr;
            
            // Create temporary ID map to track newly assigned IDs within this transaction
            const tempIdMap = new Map();
            
            nodesToUpdate.forEach(({ pos, node, reason, oldBlockId, newBlockId, newTimestamp }) => {
              // const parentId = oldBlockId || getParentId(newState.doc, pos, tempIdMap);
              const parentId = getParentId(newState.doc, pos, tempIdMap); // TODO: `paragraph \n - bullet` still paragraph is bullet's sibling, not the listitem?
              
              // Store the new ID in temp map for subsequent lookups
              tempIdMap.set(pos, newBlockId);
              
              const preservedTimelineTime = node.attrs.timelineTime || newTimestamp;
              if (LOG && node.attrs.timelineTime && node.attrs.timelineTime !== newTimestamp) {
                console.log(`🕒 TimestampPlugin preserving existing timelineTime:`, node.attrs.timelineTime, 'for block:', newBlockId.slice(-8));
              }
              
              tr.setNodeMarkup(pos, null, {
                ...node.attrs,
                blockId: newBlockId,
                createdAt: newTimestamp,
                timelineTime: preservedTimelineTime,
                parentId,
                debugNew: debugMode,
              });
              
              if (LOG) console.log(`🆕 ${reason}: ${node.type.name} at pos ${pos}`, {
                oldBlockId: oldBlockId?.slice(-8) || 'none',
                newBlockId: newBlockId.slice(-8),
                parentId: parentId?.slice(-8) || 'none',
                timestamp: newTimestamp
              });
            });
          }
          
          return tr;
        },
      }),
    ];
  },
}); 