/**
 * General Hover State Provider Plugin
 * Provides hover state management and cursor position tracking for elements
 */

import { Plugin, PluginKey } from 'prosemirror-state';

export const HoverStatePlugin = new Plugin({
  key: new PluginKey('hoverState'),
  
  state: {
    init() {
      return {
        hoveredElement: null,
        cursorElement: null,
      };
    },
    
    apply(tr, value, oldState, newState) {
      // Track cursor position changes
      const { selection } = newState;
      const cursorElement = this.getCursorElement(newState);
      
      return {
        ...value,
        cursorElement,
      };
    },
  },
  
  props: {
    handleDOMEvents: {
      mouseover(view, event) {
        const target = event.target.closest('[data-hover-target]');
        if (!target) {
          this.clearHover();
          return false;
        }
        
        this.setHover(target);
        return false;
      },
      
      mouseout(view, event) {
        // Only clear if we're not moving to a child element
        const relatedTarget = event.relatedTarget;
        if (!relatedTarget || !event.target.closest('[data-hover-target]')?.contains(relatedTarget)) {
          this.clearHover();
        }
        return false;
      },
    },
  },
  
  // Helper methods
  setHover(element) {
    // Clear previous hover states
    this.clearHover();
    
    // Add hover class
    element.classList.add('hover-active');
    
    // Dispatch custom event for other components to listen
    element.dispatchEvent(new CustomEvent('pattern-hover', {
      detail: { type: 'enter', element }
    }));
  },
  
  clearHover() {
    const hovered = document.querySelectorAll('.hover-active');
    hovered.forEach(el => {
      el.classList.remove('hover-active');
      el.dispatchEvent(new CustomEvent('pattern-hover', {
        detail: { type: 'leave', element: el }
      }));
    });
  },
  
  getCursorElement(state) {
    // Find element at cursor position
    const { selection } = state;
    const { $from } = selection;
    
    // This would need to be implemented based on specific needs
    return null;
  },
}); 