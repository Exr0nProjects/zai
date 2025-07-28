import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { generateBlockId, getCurrentTimestamp } from '../utils/snowflake.js';

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
          
          // Check for new nodes that need timestamps
          newState.doc.descendants((node, pos) => {
            if (targetNodeTypes.includes(node.type.name)) {
              // Check if this node already has a blockId
              if (!node.attrs.blockId) {
                // This is a new node that needs a timestamp
                if (!tr) {
                  tr = newState.tr;
                }
                
                const blockId = generateBlockId();
                const timestamp = getCurrentTimestamp();
                
                                 // Try to find parent node for parent tracking
                 let parentId = null;
                 try {
                   const resolved = newState.doc.resolve(pos);
                   // Only try to find parent if we're not at the top level
                   if (resolved.depth > 0) {
                     const parentPos = resolved.before();
                     if (parentPos > 0) {
                       const parentNode = newState.doc.nodeAt(parentPos);
                       if (parentNode && parentNode.attrs && parentNode.attrs.blockId) {
                         parentId = parentNode.attrs.blockId;
                       }
                     }
                   }
                 } catch (e) {
                   // If we can't resolve parent, just use null
                   parentId = null;
                 }
                
                tr.setNodeMarkup(pos, null, {
                  ...node.attrs,
                  blockId,
                  createdAt: timestamp,
                  parentId,
                });
              }
            }
          });
          
          return tr;
        },
      }),
    ];
  },
}); 