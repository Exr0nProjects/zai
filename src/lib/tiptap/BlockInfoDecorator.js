import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export const BlockInfoDecorator = Extension.create({
  name: 'blockInfoDecorator',

  addProseMirrorPlugins() {
    // Helper functions outside of the plugin
    const showBlockTooltip = (blockElement, attrs) => {
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
      
      // Position tooltip aligned with the block element in left gutter
      const rect = blockElement.getBoundingClientRect();
      tooltip.style.position = 'fixed';
      tooltip.style.left = '10px';
      tooltip.style.top = `${rect.top}px`;
      tooltip.style.zIndex = '1000';
      
      document.body.appendChild(tooltip);
    };
    
    const hideBlockTooltip = () => {
      const existing = document.getElementById('block-info-tooltip');
      if (existing) {
        existing.remove();
      }
    };

    const highlightParentBlock = (parentId) => {
      // Remove any existing parent highlights
      clearParentHighlights();
      
      if (!parentId) return;
      
      // Find the parent block element and add highlight class
      const parentElement = document.querySelector(`[data-block-id="${parentId}"]`);
      if (parentElement) {
        parentElement.classList.add('parent-highlighted');
      }
    };

    const clearParentHighlights = () => {
      // Remove parent-highlighted class from all elements
      const highlighted = document.querySelectorAll('.parent-highlighted');
      highlighted.forEach(el => el.classList.remove('parent-highlighted'));
    };

    const addHoverHighlight = (element) => {
      // Remove any existing hover highlights
      clearHoverHighlights();
      // Add hover class to the element
      element.classList.add('debug-hovered');
    };

    const clearHoverHighlights = () => {
      // Remove debug-hovered class from all elements
      const hovered = document.querySelectorAll('.debug-hovered');
      hovered.forEach(el => el.classList.remove('debug-hovered'));
    };

    // Track current hovered block to avoid unnecessary tooltip updates
    let currentHoveredBlock = null;
    
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
              // Find the closest element with block data attributes
              const target = event.target.closest('[data-block-id]');
              if (!target) return false;
              
              const blockId = target.getAttribute('data-block-id');
              
              // Only update if target block has changed
              if (currentHoveredBlock === blockId) {
                return false;
              }
              
              const createdAt = target.getAttribute('data-created-at');
              const parentId = target.getAttribute('data-parent-id');
              
              if (blockId && createdAt) {
                currentHoveredBlock = blockId;
                
                const attrs = {
                  blockId,
                  createdAt: parseInt(createdAt),
                  parentId: parentId !== 'none' ? parentId : null
                };
                
                // Add hover highlight to the main element
                addHoverHighlight(target);
                
                showBlockTooltip(target, attrs);
                // Highlight parent block if it exists
                if (attrs.parentId) {
                  highlightParentBlock(attrs.parentId);
                }
              }
              return false;
            },
            
            mouseout(view, event) {
              // Reset current hovered block
              currentHoveredBlock = null;
              hideBlockTooltip();
              clearHoverHighlights();
              clearParentHighlights();
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