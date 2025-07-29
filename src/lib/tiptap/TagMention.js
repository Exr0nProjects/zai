/**
 * Tag Mention Extension - TipTap mention extension configured for hashtags
 * Provides tag suggestions and autocompletion with # trigger
 */

import { Mention } from '@tiptap/extension-mention';
import { PluginKey } from '@tiptap/pm/state';
import tippy from 'tippy.js';
import { tagManager } from '$lib/utils/tagManager.js';

// Suggestion list component for rendering tag suggestions
function createSuggestionList() {
  let component;
  let popup;
  let selectedIndex = 0;
  let currentItems = []; // Store items locally

  return {
    onStart: (props) => {
      selectedIndex = 0;
      currentItems = props.items || [];
      
      console.log('🚀 TagMention onStart:', {
        itemsLength: currentItems.length,
        items: currentItems.map(i => i.label)
      });
      
      // Create suggestion list element
      component = document.createElement('div');
      component.className = 'tag-suggestions bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto';
      
      // Create tippy popup
      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
        theme: 'light-border',
        maxWidth: 'none',
        offset: [0, 4],
      });
    },

    onUpdate: (props) => {
      selectedIndex = 0;
      currentItems = props.items || []; // Store items for use in onKeyDown
      
      console.log('🔄 TagMention onUpdate:', {
        itemsLength: currentItems.length,
        query: props.query,
        items: currentItems.map(i => ({ label: i.label, isNew: i.isNew }))
      });
      
      if (!component) return;
      
      // Clear previous suggestions
      component.innerHTML = '';
      
      // Safety check for items
      if (currentItems.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'px-3 py-2 text-gray-500 text-sm';
        noResults.textContent = 'No tags found';
        component.appendChild(noResults);
        return;
      }
      
      // Render suggestions using stored items
      currentItems.forEach((item, index) => {
        const suggestionEl = document.createElement('button');
        suggestionEl.className = `w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between ${
          index === selectedIndex ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
        }`;
        
        const tagName = document.createElement('span');
        tagName.className = 'font-medium';
        tagName.textContent = `#${item.label}`;
        
        const tagCount = document.createElement('span');
        tagCount.className = 'text-xs text-gray-400';
        
        // Show different text for new vs existing tags
        if (item.isNew) {
          tagCount.textContent = 'Create';
          tagCount.className = 'text-xs text-green-600';
        } else {
          tagCount.textContent = item.count > 1 ? `${item.count}×` : '';
        }
        
        suggestionEl.appendChild(tagName);
        suggestionEl.appendChild(tagCount);
        
        suggestionEl.addEventListener('click', () => {
          props.command({ id: item.id, label: item.label, isNew: item.isNew });
        });
        
        component.appendChild(suggestionEl);
      });
      
      // Update popup position - fix the error by checking if popup exists and is array
      if (popup && Array.isArray(popup) && popup[0]) {
        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      } else if (popup && popup.setProps) {
        // Handle single popup instance
        popup.setProps({
          getReferenceClientRect: props.clientRect,
        });
      }
    },

    onKeyDown: (props) => {
      console.log('🎯 TagMention onKeyDown:', {
        key: props.event.key,
        ctrlKey: props.event.ctrlKey,
        currentItemsLength: currentItems.length,
        selectedIndex
      });
      
      // Only handle Tab as alias for Enter, let TipTap handle everything else
      if (props.event.key === 'Tab') {
        console.log('🔄 Tab → treating as Enter for TipTap selection');
        props.event.preventDefault();
        // Let TipTap's default Enter handling work (no synthetic events needed)
        return false; 
      }
      
      // Handle Ctrl+N/P for vim users (navigate only, let TipTap handle selection)
      if (props.event.ctrlKey && (props.event.key === 'n' || props.event.key === 'p')) {
        console.log('🎯 Ctrl+N/P navigation');
        props.event.preventDefault();
        
        if (props.event.key === 'n') {
          selectedIndex = Math.min(currentItems.length - 1, selectedIndex + 1);
        } else {
          selectedIndex = Math.max(0, selectedIndex - 1);
        }
        updateSelection();
        return true;
      }
      
      // Let TipTap handle EVERYTHING else (Enter, Arrow keys, Escape, etc.)
      console.log('⏩ TipTap handles:', props.event.key);
      return false;
    },

    onExit: () => {
      // Fix the error by properly checking popup type
      if (popup) {
        if (Array.isArray(popup) && popup[0] && popup[0].destroy) {
          popup[0].destroy();
        } else if (popup.destroy) {
          popup.destroy();
        }
      }
      component = null;
      popup = null;
    },
  };
  
  function updateSelection() {
    if (!component) return;
    
    const buttons = component.querySelectorAll('button');
    buttons.forEach((button, index) => {
      if (index === selectedIndex) {
        button.className = button.className.replace('text-gray-900', 'text-blue-600').replace('hover:bg-gray-100', 'bg-blue-50');
      } else {
        button.className = button.className.replace('text-blue-600', 'text-gray-900').replace('bg-blue-50', 'hover:bg-gray-100');
      }
    });
  }
}

// Configure the mention extension for tags  
export const TagMention = Mention.extend({
  // Override keyboard shortcuts to handle Enter priority FIRST
  addKeyboardShortcuts() {
    return {
      // Override Enter key when suggestions are active - HIGHER PRIORITY than default
      'Enter': () => {
        
        // Check if our suggestion system is active
        const suggestionPlugin = this.editor.view.state.plugins.find(
          plugin => plugin.key && plugin.key.key && plugin.key.key.includes('suggestion')
        );
        
        if (suggestionPlugin) {
          const suggestionState = suggestionPlugin.getState(this.editor.view.state);
          
          if (suggestionState && suggestionState.active) {
            return false;
          }
        }
        
        // Not in suggestion mode, let default Enter behavior happen
        return false;
      },
    };
  },
}).configure({
  HTMLAttributes: {
    class: 'tag-mention bg-blue-100 text-blue-800 px-1 rounded',
  },
  renderText({ options, node }) {
    return `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`;
  },
  suggestion: {
    char: '#',
    pluginKey: new PluginKey('tagMention'),
    
    // Function to get suggestion items
    items: async ({ query }) => {
      try {
        // Get current tags from manager
        let tags = [];
        
        try {
          tags = await tagManager.getTags();
        } catch (error) {
          console.warn('Could not get tags from manager:', error);
          tags = [];
        }
        
        // Filter tags based on query
        const filteredTags = tagManager.filterTags(tags, query);
        
        // Always add "Create new tag" option at the bottom if there's a query
        if (query && query.length > 1) {
          const exactMatch = filteredTags.find(tag => tag.label.toLowerCase() === query.toLowerCase());
          if (!exactMatch) {
            // Add new tag option at the END of the list
            filteredTags.push({
              id: query.toLowerCase(),
              label: query.toLowerCase(),
              count: 0,
              isNew: true
            });
          }
        }
        
        return filteredTags;
      } catch (error) {
        console.error('Error fetching tag suggestions:', error);
        return [];
      }
    },
    
    // Command executed when a suggestion is selected
    command: ({ editor, range, props }) => {
      console.log('🎯 Suggestion command executing:', { props });
      
      // Add tag to registry if it's new
      if (props.isNew) {
        setTimeout(async () => {
          try {
            await tagManager.addNewTag(props.label);
          } catch (error) {
            console.warn('Could not add tag to registry:', error);
          }
        }, 0);
      }
      
      // Replace the range with the mention node
      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          {
            type: 'mention',
            attrs: {
              id: props.id,
              label: props.label,
            },
          },
          {
            type: 'text',
            text: ' ',
          },
        ])
        .run();
    },
    
    // Render suggestions
    render: createSuggestionList,
    
    // Allow spaces in tags? No, keep it simple
    allowSpaces: false,
    
    // Start suggestions immediately after #
    startOfLine: false,
  },
}); 