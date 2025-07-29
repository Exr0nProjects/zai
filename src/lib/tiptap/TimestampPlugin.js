import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { generateBlockId, getCurrentTimestamp } from '../utils/snowflake.js';

// Helper function to find parent blockId
function getParentId(doc, pos) {
  try {
    const resolved = doc.resolve(pos);
    if (resolved.depth > 0) {
      const parentPos = resolved.before();
      if (parentPos > 0) {
        const parentNode = doc.nodeAt(parentPos);
        if (parentNode && parentNode.attrs && parentNode.attrs.blockId) {
          return parentNode.attrs.blockId;
        }
      }
    }
  } catch (e) {
    // If we can't resolve parent, return null
  }
  return null;
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
                nodesToUpdate.push({
                  pos,
                  node,
                  reason: 'missing-id',
                  newBlockId: generateBlockId(),
                  newTimestamp: getCurrentTimestamp()
                });
                console.log(`✨ Found node without blockId: ${node.type.name} at ${pos}`);
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
                  console.log(`🔄 Found DUPLICATE blockId: ${node.attrs.blockId.slice(-8)} on ${node.type.name} at ${pos}`);
                } else {
                  seenBlockIds.add(node.attrs.blockId);
                }
              }
            }
          });

          // Second pass: apply updates if any were needed
          if (nodesToUpdate.length > 0) {
            tr = newState.tr;
            
            nodesToUpdate.forEach(({ pos, node, reason, oldBlockId, newBlockId, newTimestamp }) => {
              const parentId = getParentId(newState.doc, pos);
              
              if (reason === 'duplicate-id') {
                console.log(`🆕 REPLACING duplicate blockId:`, {
                  oldBlockId: oldBlockId.slice(-8),
                  newBlockId: newBlockId.slice(-8),
                  nodeType: node.type.name,
                  pos
                });
              } else {
                console.log(`✨ ASSIGNING new blockId:`, {
                  newBlockId: newBlockId.slice(-8),
                  nodeType: node.type.name,
                  pos
                });
              }
              
              tr.setNodeMarkup(pos, null, {
                ...node.attrs,
                blockId: newBlockId,
                createdAt: newTimestamp,
                parentId,
                debugNew: debugMode,
              });
            });
          }
          
          return tr;
        },
      }),
    ];
  },
}); 