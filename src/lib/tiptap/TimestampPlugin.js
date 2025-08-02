import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { generateBlockId, getCurrentTimestamp } from '../utils/snowflake.js';

const LOG = false;

// Helper function to check if a node is an empty top-level paragraph
function isEmptyTopLevelParagraph(node, pos, doc) {
  if (node.type.name !== 'paragraph') return false;
  
  // Check if it's at the top level (depth 0)
  const resolved = doc.resolve(pos);
  if (resolved.depth !== 0) return false;
  
  // Check if it's empty (no content or only whitespace)
  const textContent = node.textContent || '';
  return textContent.trim().length === 0;
}

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
          
          // Check for deleted nodes and update parent children arrays
          const oldBlockIds = new Set();
          const newBlockIds = new Set();
          const parentMap = new Map(); // blockId -> parentId
          const childrenMap = new Map(); // blockId -> children array
          
          oldState.doc.descendants((node) => {
            if (node.attrs?.blockId) {
              oldBlockIds.add(node.attrs.blockId);
              if (node.attrs.parentId) {
                parentMap.set(node.attrs.blockId, node.attrs.parentId);
              }
              if (node.attrs.children) {
                childrenMap.set(node.attrs.blockId, node.attrs.children);
              }
            }
          });
          
          newState.doc.descendants((node) => {
            if (node.attrs?.blockId) {
              newBlockIds.add(node.attrs.blockId);
            }
          });
          
          const deletedBlockIds = [...oldBlockIds].filter(id => !newBlockIds.has(id));
          
          // Handle parent/child relationship updates for deleted nodes
          let relationshipUpdateTr = null;
          if (deletedBlockIds.length > 0) {
            const relationshipUpdates = new Map(); // nodePos -> new attributes
            
            deletedBlockIds.forEach(deletedId => {
              const deletedParentId = parentMap.get(deletedId);
              const deletedChildren = childrenMap.get(deletedId) || [];
              
              if (LOG) console.log(`🗑️ Processing deletion of block ${deletedId.slice(-8)}, parent: ${deletedParentId?.slice(-8) || 'none'}, children: [${deletedChildren.map(id => id.slice(-8)).join(', ')}]`);
              
              // Update each child's parent to point to the deleted node's parent
              deletedChildren.forEach(childId => {
                // Find the child node in the new state and update its parentId
                newState.doc.descendants((node, pos) => {
                  if (node.attrs?.blockId === childId) {
                    const newParentId = deletedParentId || null;
                    
                    if (node.attrs.parentId !== newParentId) {
                      relationshipUpdates.set(pos, {
                        ...node.attrs,
                        parentId: newParentId
                      });
                      
                      if (LOG) console.log(`🔗 Updating child ${childId.slice(-8)} parent: ${node.attrs.parentId?.slice(-8) || 'none'} -> ${newParentId?.slice(-8) || 'none'}`);
                    }
                    return false; // Stop traversing once found
                  }
                });
              });
              
              // Update the parent's children array to remove deleted node and add its children
              if (deletedParentId) {
                newState.doc.descendants((node, pos) => {
                  if (node.attrs?.blockId === deletedParentId) {
                    const currentChildren = node.attrs.children || [];
                    // Remove the deleted node and add its children
                    const newChildren = currentChildren
                      .filter(id => id !== deletedId) // Remove deleted node
                      .concat(deletedChildren); // Add deleted node's children
                    
                    // Deduplicate
                    const uniqueChildren = [...new Set(newChildren)];
                    
                    if (JSON.stringify(currentChildren) !== JSON.stringify(uniqueChildren)) {
                      const existingUpdate = relationshipUpdates.get(pos);
                      relationshipUpdates.set(pos, {
                        ...(existingUpdate || node.attrs),
                        children: uniqueChildren
                      });
                      
                      if (LOG) console.log(`👨‍👧‍👦 Updating parent ${deletedParentId.slice(-8)} children: removing ${deletedId.slice(-8)}, adding [${deletedChildren.map(id => id.slice(-8)).join(', ')}]`);
                    }
                    return false; // Stop traversing once found
                  }
                });
              }
            });
            
            // Apply all relationship updates in a single transaction
            if (relationshipUpdates.size > 0) {
              relationshipUpdateTr = newState.tr.setMeta('zai-relationshipUpdate', true);
              
              relationshipUpdates.forEach((newAttrs, pos) => {
                relationshipUpdateTr.setNodeMarkup(pos, null, newAttrs);
              });
              
              if (LOG) console.log(`🔄 Applied ${relationshipUpdates.size} relationship updates for ${deletedBlockIds.length} deleted blocks`);
            }
          }
          
          // Skip processing for timeline sort transactions
          const isTimelineSort = transactions.some(tr => tr.getMeta('timelineSort'));
          if (isTimelineSort) {
            if (LOG) console.log('🕒 TimestampPlugin skipping timeline sort transaction');
            return null;
          }
          
          // Skip processing for our own timestamp transactions to prevent infinite loops
          const isTimestampTransaction = transactions.some(tr => tr.getMeta('zai-idRelabel'));
          if (isTimestampTransaction) {
            if (LOG) console.log('🕒 TimestampPlugin skipping own timestamp transaction');
            return null;
          }
          
          // Skip processing for our own relationship update transactions to prevent infinite loops
          const isRelationshipTransaction = transactions.some(tr => tr.getMeta('zai-relationshipUpdate'));
          if (isRelationshipTransaction) {
            if (LOG) console.log('🕒 TimestampPlugin skipping own relationship transaction');
            return null;
          }
          
          // Skip processing for Y.js collaboration transactions
          const isCollabTransaction = transactions.some(tr => tr.getMeta('y-sync$'));
          if (isCollabTransaction) {
            if (LOG) console.log('🕒 TimestampPlugin skipping Y.js collaboration transaction');
            return null;
          }
          
          let tr = null;
          const targetNodeTypes = ['paragraph', 'heading', 'customListItem', 'blockquote', 'codeBlock', 'horizontalRule'];
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
            const parentChildUpdates = new Map(); // Track parent children to add
            const parentChildRemovals = new Map(); // Track parent children to remove
            
            nodesToUpdate.forEach(({ pos, node, reason, oldBlockId, newBlockId, newTimestamp }) => {
              // const parentId = oldBlockId || getParentId(newState.doc, pos, tempIdMap);
              let parentId = getParentId(newState.doc, pos, tempIdMap); // TODO: `paragraph \n - bullet` still paragraph is bullet's sibling, not the listitem?
              const oldParentId = node.attrs.parentId; // Track the old parent to update its children array
              
              // Special case for duplicate blockIds: check if parent and its parent are both empty top-level paragraphs
              if (reason === 'duplicate-id' && parentId) {
                // Find the original node with the duplicate blockId
                let originalNode = null;
                let originalPos = null;
                newState.doc.descendants((n, p) => {
                  if (n.attrs?.blockId === oldBlockId && p !== pos) {
                    originalNode = n;
                    originalPos = p;
                    return false; // Stop traversal
                  }
                });
                
                if (originalNode && originalPos !== null) {
                  // Check if the original node is an empty top-level paragraph
                  if (isEmptyTopLevelParagraph(originalNode, originalPos, newState.doc)) {
                    // Check if the original node's parent is also an empty top-level paragraph
                    if (originalNode.attrs?.parentId) {
                      let originalParentNode = null;
                      let originalParentPos = null;
                      newState.doc.descendants((n, p) => {
                        if (n.attrs?.blockId === originalNode.attrs.parentId) {
                          originalParentNode = n;
                          originalParentPos = p;
                          return false; // Stop traversal
                        }
                      });
                      
                      if (originalParentNode && originalParentPos !== null && 
                          isEmptyTopLevelParagraph(originalParentNode, originalParentPos, newState.doc)) {
                        // Both parent and grandparent are empty top-level paragraphs, set parent to null
                        parentId = null;
                        
                        // Also remove this node from old parent's children array since parentId is now null
                        if (oldParentId) {
                          if (!parentChildRemovals.has(oldParentId)) {
                            parentChildRemovals.set(oldParentId, new Set());
                          }
                          parentChildRemovals.get(oldParentId).add(newBlockId);
                        }
                      }
                    }
                  }
                }
              }
              
              // Store the new ID in temp map for subsequent lookups
              tempIdMap.set(pos, newBlockId);
              
              const preservedTimelineTime = node.attrs.timelineTime || newTimestamp;
              if (LOG && node.attrs.timelineTime && node.attrs.timelineTime !== newTimestamp) {
                console.log(`🕒 TimestampPlugin preserving existing timelineTime:`, node.attrs.timelineTime, 'for block:', newBlockId.slice(-8));
              }
              
              // Preserve existing children array for all nodes (now part of common interface)
              const preservedChildren = node.attrs.children || [];
              
              tr.setNodeMarkup(pos, null, {
                ...node.attrs,
                blockId: newBlockId,
                createdAt: newTimestamp,
                timelineTime: preservedTimelineTime,
                parentId,
                children: preservedChildren,
                debugNew: debugMode,
              });

              // Track parent-child relationship updates needed
              // Handle old parent removal (if parent changed or node got new ID)
              if (oldParentId && (oldParentId !== parentId || oldBlockId !== newBlockId)) {
                const childIdToRemove = reason === 'duplicate-id' ? oldBlockId : newBlockId;
                if (!parentChildRemovals.has(oldParentId)) {
                  parentChildRemovals.set(oldParentId, new Set());
                }
                parentChildRemovals.get(oldParentId).add(childIdToRemove);
              }
              
              // Handle new parent addition
              if (parentId) {
                if (!parentChildUpdates.has(parentId)) {
                  parentChildUpdates.set(parentId, new Set());
                }
                parentChildUpdates.get(parentId).add(newBlockId);
              }
              
              if (LOG) console.log(`🆕 ${reason}: ${node.type.name} at pos ${pos}`, {
                oldBlockId: oldBlockId?.slice(-8) || 'none',
                newBlockId: newBlockId.slice(-8),
                parentId: parentId?.slice(-8) || 'none',
                timestamp: newTimestamp
              });
            });
            
            // Update parent children arrays in the same transaction
            const allParentUpdates = new Set([...parentChildUpdates.keys(), ...parentChildRemovals.keys()]);
            
            allParentUpdates.forEach(parentId => {
              tr.doc.descendants((node, pos) => {
                if (node.attrs && node.attrs.blockId === parentId) {
                  const currentChildren = node.attrs.children || [];
                  let newChildren = [...currentChildren];
                  
                  // Remove children that need to be removed
                  if (parentChildRemovals.has(parentId)) {
                    const toRemove = parentChildRemovals.get(parentId);
                    newChildren = newChildren.filter(id => !toRemove.has(id));
                  }
                  
                  // Add new children
                  if (parentChildUpdates.has(parentId)) {
                    const toAdd = parentChildUpdates.get(parentId);
                    newChildren = [...new Set([...newChildren, ...toAdd])]; // Merge and deduplicate
                  }
                  
                  // Only update if children array changed
                  if (JSON.stringify(currentChildren.sort()) !== JSON.stringify(newChildren.sort())) {
                    tr.setNodeMarkup(pos, null, {
                      ...node.attrs,
                      children: newChildren
                    });
                    
                    if (LOG) console.log(`👨‍👧‍👦 Updated parent ${parentId.slice(-8)} children: ${currentChildren.length} -> ${newChildren.length}`);
                  }
                  
                  return false; // Stop traversal for this parent
                }
              });
            });
          }
          
          // Handle node deletions - update parent children arrays
          if (deletedBlockIds.length > 0) {
            if (!tr) tr = newState.tr;
            
            deletedBlockIds.forEach(deletedId => {
              const parentId = parentMap.get(deletedId);
              if (parentId) {
                tr.doc.descendants((node, pos) => {
                  if (node.attrs?.blockId === parentId) {
                    const currentChildren = node.attrs.children || [];
                    const newChildren = currentChildren.filter(id => id !== deletedId);
                    
                    tr.setNodeMarkup(pos, null, {
                      ...node.attrs,
                      children: newChildren
                    });
                    return false;
                  }
                });
              }
            });
          }
          
          if (tr) {

                        tr.setMeta('zai-idRelabel', true);
          }
          
          // Combine transactions if needed
          if (tr && relationshipUpdateTr) {
            // We have both relationship updates and timestamp updates
            // Apply relationship updates to the timestamp transaction
            relationshipUpdateTr.steps.forEach(step => {
              tr.step(step);
            });
            tr.setMeta('zai-idRelabel', true);
            tr.setMeta('zai-relationshipUpdate', true);
            return tr;
          } else if (tr) {
            // Only timestamp updates
            return tr;
          } else if (relationshipUpdateTr) {
            // Only relationship updates
            return relationshipUpdateTr;
          }
          
          return null;
        },
      }),
    ];
  },
}); 