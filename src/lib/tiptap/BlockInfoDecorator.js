import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

// Flag to control parent bracket visibility
let showParentBrackets = false;

export function toggleParentBrackets(enabled) {
  showParentBrackets = enabled;
}

export function isParentBracketsEnabled() {
  return showParentBrackets;
}

export const BlockInfoDecorator = Extension.create({
  name: 'blockInfoDecorator',

  addProseMirrorPlugins() {
    // Helper functions outside of the plugin
    const showBlockTooltip = (blockElement, attrs) => {
      hideBlockTooltip(); // Remove any existing tooltip
      
      const tooltip = document.createElement('div');
      tooltip.id = 'block-info-tooltip';
      tooltip.className = 'block-info-tooltip';
      
      // Handle createdAt - it's an ISO string, not a timestamp
      let createdDate = null;
      if (attrs.createdAt) {
        // Try parsing as ISO string first, then as timestamp
        if (typeof attrs.createdAt === 'string' && attrs.createdAt.includes('T')) {
          createdDate = new Date(attrs.createdAt);
        } else {
          // Handle as timestamp (could be string or number)
          const timestamp = parseInt(attrs.createdAt);
          createdDate = new Date(timestamp);
        }
      }
      
      // Handle timelineTime - could be ISO string or timestamp
      let timelineDate = null;
      if (attrs.timelineTime && attrs.timelineTime !== 'null') {
        timelineDate = new Date(attrs.timelineTime);
      }
      
      // Format the timestamps as raw date/time
      const createdTimeDisplay = createdDate && !isNaN(createdDate.getTime()) ? 
        createdDate.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: '2-digit',
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }) : 'unknown';
      const timelineTimeDisplay = timelineDate && !isNaN(timelineDate.getTime()) ? 
        timelineDate.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: '2-digit',
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }) : null;
      
      // Build tooltip content
      let tooltipContent = `
        <div class="block-info-content">
          <div class="block-info-row">
            <span class="block-info-label">ID:</span>
            <span class="block-info-value">${attrs.blockId.slice(-8)}</span>
          </div>
          <div class="block-info-row">
            <span class="block-info-label">Created:</span>
            <span class="block-info-value">${createdTimeDisplay}</span>
          </div>`;
      
      // Add timelineTime row if it exists
      if (timelineTimeDisplay) {
        tooltipContent += `
          <div class="block-info-row">
            <span class="block-info-label">Timeline:</span>
            <span class="block-info-value">${timelineTimeDisplay}</span>
          </div>`;
      }
      
      tooltipContent += `
          <div class="block-info-row">
            <span class="block-info-label">Parent:</span>
            <span class="block-info-value">${attrs.parentId ? attrs.parentId.slice(-8) : 'none'}</span>
          </div>
        </div>
      `;
      
      tooltip.innerHTML = tooltipContent;
      
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

    const createBracketElement = (attrs, view) => {
      console.log('createBracketElement', attrs)
      const container = document.createElement('div');
      container.className = 'parent-bracket-widget';
      
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '20');
      svg.setAttribute('height', '20');
      svg.setAttribute('viewBox', '0 0 20 20');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '1.5');
      
      if (attrs.parentId) {
        // Check if parent exists in the document
        const parentElement = document.querySelector(`[data-block-id="${attrs.parentId}"]`);
        
        if (parentElement) {
          // Draw bracket connecting to parent
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', 'M16 2 L4 2 L4 10 L10 10');
          path.setAttribute('stroke-linecap', 'round');
          path.setAttribute('stroke-linejoin', 'round');
          svg.appendChild(path);
          
          // Add small arrow
          const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          arrow.setAttribute('d', 'M8 8 L10 10 L8 12');
          arrow.setAttribute('stroke-linecap', 'round');
          arrow.setAttribute('stroke-linejoin', 'round');
          svg.appendChild(arrow);
        } else {
          // Parent not found, draw broken bracket
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', 'M16 2 L4 2 L4 10 L1 10');
          path.setAttribute('stroke-linecap', 'round');
          path.setAttribute('stroke-linejoin', 'round');
          path.setAttribute('stroke-dasharray', '2,2');
          svg.appendChild(path);
        }
      } else {
        // No parent, draw line going off screen
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M16 10 L0 10');
        path.setAttribute('stroke-linecap', 'round');
        svg.appendChild(path);
      }
      
      container.appendChild(svg);
      return container;
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
    
    const createDecorations = (state, currentHoveredBlockId = null) => {
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
          
          // Add parent bracket widget decoration if this is the hovered block
          if (showParentBrackets && currentHoveredBlockId === node.attrs.blockId) {
            const bracketWidget = Decoration.widget(pos, (view, getPos) => {
              return createBracketElement(node.attrs, view);
            }, {
              side: -1, // Place before the node
              key: `parent-bracket-${pos}`,
            });
            decorations.push(bracketWidget);
          }
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
              hoveredBlockId: null,
            };
          },
          
          apply(tr, value, oldState, newState) {
            let { hoveredBlockId } = value;
            
            // Check for hover updates from meta
            const hoverMeta = tr.getMeta('blockInfoHover');
            if (hoverMeta !== undefined) {
              hoveredBlockId = hoverMeta;
            }
            
            return {
              decorations: createDecorations(newState, hoveredBlockId),
              hoveredBlockId,
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
              const timelineTime = target.getAttribute('data-timeline-time');
              const parentId = target.getAttribute('data-parent-id');
              
              if (blockId && createdAt) {
                currentHoveredBlock = blockId;
                
                const attrs = {
                  blockId,
                  createdAt: createdAt,
                  timelineTime: timelineTime,
                  parentId: parentId !== 'none' ? parentId : null
                };
                
                // Add hover highlight to the main element
                addHoverHighlight(target);
                
                showBlockTooltip(target, attrs);
                // Update hover state for parent bracket decoration
                const tr = view.state.tr.setMeta('blockInfoHover', blockId);
                view.dispatch(tr);
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
              // Clear hover state for parent bracket decoration
              const tr = view.state.tr.setMeta('blockInfoHover', null);
              view.dispatch(tr);
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