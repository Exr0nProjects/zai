/**
 * Tag Parser Plugin - Automatically converts hashtags to tag mentions
 * Parses document content and converts #hashtags to visual tag mention nodes
 */

import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { tagManager } from '$lib/utils/tagManager.js';

const TAG_REGEX = /(?:^|\s)(#([a-zA-Z0-9_-]+))(?=\s|$|[^\w-])/g;

export const TagParserPlugin = new Plugin({
  key: new PluginKey('tagParser'),
  
  state: {
    init() {
      return DecorationSet.empty;
    },
    
    apply(tr, decorationSet, oldState, newState) {
      // If content hasn't changed, keep existing decorations
      if (!tr.docChanged) {
        return decorationSet.map(tr.mapping, tr.doc);
      }
      
      // Parse document for hashtags and convert to mentions
      setTimeout(() => {
        parseAndConvertHashtags(newState, tr);
      }, 0);
      
      return DecorationSet.empty;
    }
  },
  
  view() {
    return {};
  }
});

async function parseAndConvertHashtags(state, tr) {
  const { doc, schema } = state;
  const changes = [];
  
  // Walk through all text nodes
  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      const text = node.text;
      let match;
      TAG_REGEX.lastIndex = 0;
      
      while ((match = TAG_REGEX.exec(text)) !== null) {
        const fullMatch = match[1]; // #hashtag
        const tagName = match[2]; // hashtag
        const start = match.index + (match[0].startsWith(' ') ? 1 : 0); // Adjust for leading space
        const end = start + fullMatch.length;
        
        // Skip if tag is too short or numbers only
        if (tagName.length < 2 || /^\d+$/.test(tagName)) {
          continue;
        }
        
        // Only convert if not already a mention node
        const resolvedPos = doc.resolve(pos + start);
        const nodeAfter = resolvedPos.nodeAfter;
        
        if (!nodeAfter || nodeAfter.type.name !== 'mention') {
          changes.push({
            from: pos + start,
            to: pos + end,
            tagName: tagName.toLowerCase(),
            fullMatch
          });
          
          // Add tag to registry asynchronously
          setTimeout(async () => {
            try {
              await tagManager.addNewTag(tagName.toLowerCase());
            } catch (error) {
              console.warn('Could not add tag to registry:', error);
            }
          }, 0);
        }
      }
    }
  });
  
  // Apply changes from end to start to maintain positions
  if (changes.length > 0) {
    changes.reverse().forEach(change => {
      const view = window.editorView; // We'll set this globally
      if (view && schema.nodes.mention) {
        const mentionNode = schema.nodes.mention.create({
          id: change.tagName,
          label: change.tagName
        });
        
        const transaction = view.state.tr.replaceWith(
          change.from,
          change.to,
          mentionNode
        );
        
        // Apply transaction asynchronously to avoid conflicts
        setTimeout(() => {
          if (view.state.doc.textBetween(change.from, change.to) === change.fullMatch) {
            view.dispatch(transaction);
          }
        }, 10);
      }
    });
  }
}

// TipTap extension wrapper
export const TagParser = {
  name: 'tagParser',
  
  addProseMirrorPlugins() {
    return [TagParserPlugin];
  },
  
  onUpdate({ editor }) {
    // Store editor view globally for the plugin to use
    window.editorView = editor.view;
  }
}; 