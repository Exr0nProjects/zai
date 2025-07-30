/**
 * Time Gutter Plugin
 * Adds time gutters to the left of block elements using decorations
 */

import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { getBlockTimeDisplay } from '../utils/timeGutter.js';

export const TimeGutterPlugin = new Plugin({
  key: new PluginKey('timeGutter'),
  
  state: {
    init(config, state) {
      return {
        decorations: createTimeGutterDecorations(state),
      };
    },
    
    apply(tr, value, oldState, newState) {
      return {
        decorations: createTimeGutterDecorations(newState),
      };
    },
  },
  
  props: {
    decorations(state) {
      return this.getState(state).decorations;
    },
  },
});

function createTimeGutterDecorations(state) {
  const decorations = [];
  
  // Traverse the document and add decorations for block elements
  state.doc.descendants((node, pos) => {
    // Only process block nodes that have attributes
    if (!node.isBlock || !node.attrs) return;
    
    // Get time display for this block
    const timeDisplay = getBlockTimeDisplay(node.attrs);
    
    if (timeDisplay) {
      // Create a widget decoration at the start of the block
      const widget = Decoration.widget(pos, (view, getPos) => {
        const gutterElement = document.createElement('div');
        gutterElement.className = 'time-gutter-widget';
        gutterElement.textContent = timeDisplay;
        gutterElement.setAttribute('data-time-display', timeDisplay);
        return gutterElement;
      }, {
        side: -1, // Place before the node
        key: `time-gutter-${pos}`,
      });
      
      decorations.push(widget);
    }
  });
  
  return DecorationSet.create(state.doc, decorations);
} 