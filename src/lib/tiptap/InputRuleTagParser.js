/**
 * Input Rule Tag Parser - Converts hashtags to mentions as user types
 * Provides real-time conversion of #hashtag to tag mention nodes
 */

import { InputRule } from '@tiptap/core';
import { tagManager } from '$lib/utils/tagManager.js';

// Input rule to convert hashtags to mentions as user types
export function createTagInputRule(type) {
  return new InputRule({
    find: /(?:^|\s)(#([a-zA-Z0-9_-]+))(\s)$/,
    handler: ({ state, range, match }) => {
      const [, fullMatch, tagName, space] = match;
      
      // Skip short tags or number-only tags
      if (tagName.length < 2 || /^\d+$/.test(tagName)) {
        return null;
      }
      
      const { tr } = state;
      const start = range.from;
      const end = range.to;
      
      // Add tag to registry asynchronously
      setTimeout(async () => {
        try {
          await tagManager.addNewTag(tagName.toLowerCase());
        } catch (error) {
          console.warn('Could not add tag to registry:', error);
        }
      }, 0);
      
      // Replace with mention node followed by space
      tr.replaceWith(
        start,
        end - 1, // Don't include the trailing space in replacement
        type.create({
          id: tagName.toLowerCase(),
          label: tagName.toLowerCase()
        })
      );
      
      // Add space after mention
      tr.insertText(' ', tr.selection.from);
    },
  });
}

// Extension that adds the input rule
export const InputRuleTagParser = {
  name: 'inputRuleTagParser',
  
  addInputRules() {
    return [
      createTagInputRule(this.editor.schema.nodes.mention)
    ];
  }
}; 