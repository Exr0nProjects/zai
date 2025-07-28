/**
 * Keyboard Navigation Plugin - Improves keyboard navigation for tag system
 * Removes tab focus from checkboxes and other irrelevant elements
 */

import { Plugin, PluginKey } from '@tiptap/pm/state';

export const KeyboardNavigationPlugin = new Plugin({
  key: new PluginKey('keyboardNavigation'),
  
  view(editorView) {
    // Function to remove tabindex from checkboxes and other elements
    const removeTabIndexFromIrrelevantElements = () => {
      // Remove tabindex from task checkboxes
      const checkboxes = editorView.dom.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        checkbox.setAttribute('tabindex', '-1');
      });
      
      // Remove tabindex from any other focusable elements that shouldn't be in tab order
      const buttons = editorView.dom.querySelectorAll('button:not([data-keep-tabindex])');
      buttons.forEach(button => {
        if (!button.closest('.tag-suggestions')) { // Keep tag suggestion buttons focusable
          button.setAttribute('tabindex', '-1');
        }
      });
    };
    
    // Initial cleanup
    removeTabIndexFromIrrelevantElements();
    
    // Set up mutation observer to handle dynamically added elements
    const observer = new MutationObserver(() => {
      removeTabIndexFromIrrelevantElements();
    });
    
    observer.observe(editorView.dom, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['tabindex']
    });
    
    return {
      destroy() {
        observer.disconnect();
      }
    };
  }
});

// TipTap extension wrapper
export const KeyboardNavigation = {
  name: 'keyboardNavigation',
  
  addProseMirrorPlugins() {
    return [KeyboardNavigationPlugin];
  }
}; 