import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export const BlockInfoDecorator = Extension.create({
  name: 'blockInfoDecorator',

  addProseMirrorPlugins() {
    // Helper functions outside of the plugin
    const showBlockTooltip = (event, attrs) => {
      // Check if tooltips are enabled via CSS variable
      const tooltipDisplay = getComputedStyle(document.documentElement).getPropertyValue('--block-tooltips').trim();
      if (tooltipDisplay === 'none') return;
      
      hideBlockTooltip(); // Remove any existing tooltip
      
      const tooltip = document.createElement('div');
      tooltip.id = 'block-info-tooltip';
      tooltip.className = 'block-info-tooltip';
      
      const createdDate = new Date(attrs.createdAt);
      const timeAgo = getTimeAgo(createdDate);
      
      tooltip.innerHTML = `
        <div class="block-info-content">
          <div class="block-info-row">
            <span class="block-info-label">ID:</span>
            <span class="block-info-value">${attrs.blockId.slice(-8)}</span>
          </div>
          <div class="block-info-row">
            <span class="block-info-label">Created:</span>
            <span class="block-info-value">${timeAgo}</span>
          </div>
          <div class="block-info-row">
            <span class="block-info-label">Parent:</span>
            <span class="block-info-value">${attrs.parentId ? attrs.parentId.slice(-8) : 'none'}</span>
          </div>
        </div>
      `;
      
      // Position tooltip in left gutter
      tooltip.style.position = 'fixed';
      tooltip.style.left = '10px';
      tooltip.style.top = `${event.clientY - 30}px`;
      tooltip.style.zIndex = '1000';
      
      document.body.appendChild(tooltip);
    };
    
    const hideBlockTooltip = () => {
      const existing = document.getElementById('block-info-tooltip');
      if (existing) {
        existing.remove();
      }
    };
    
    const getTimeAgo = (date) => {
      const now = new Date();
      const diffMs = now - date;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffSecs < 60) return `${diffSecs}s ago`;
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    };
    
    const createDecorations = (state) => {
      const decorations = [];
      
      state.doc.descendants((node, pos) => {
        if (node.attrs && node.attrs.blockId) {
          // Add block border decoration
          const decoration = Decoration.node(pos, pos + node.nodeSize, {
            class: 'block-with-info',
            'data-block-id': node.attrs.blockId,
            'data-created-at': node.attrs.createdAt,
            'data-parent-id': node.attrs.parentId || 'none',
          });
                        decorations.push(decoration);
        }
      });
      
      return DecorationSet.create(state.doc, decorations);
    };

    return [
      new Plugin({
        key: new PluginKey('blockInfoDecorator'),
        
        state: {
          init(config, state) {
            return {
              decorations: createDecorations(state),
            };
          },
          
          apply(tr, value, oldState, newState) {
            return {
              decorations: createDecorations(newState),
            };
          },
        },
        
        props: {
          decorations(state) {
            return this.getState(state).decorations;
          },
          
          handleDOMEvents: {
            mouseover(view, event) {
              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (!pos) return false;
              
              const node = view.state.doc.nodeAt(pos.pos);
              if (node && node.attrs && node.attrs.blockId) {
                showBlockTooltip(event, node.attrs);
              }
              return false;
            },
            
            mouseout(view, event) {
              hideBlockTooltip();
              return false;
            },
          },
        },
      }),
    ];
  },
  
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'listItem', 'taskItem', 'bulletList', 'taskList'],
        attributes: {
          'data-block-info': {
            default: null,
            rendered: false, // Don't render as HTML attribute
          },
        },
      },
    ];
  },
}); 