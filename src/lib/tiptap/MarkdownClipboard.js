import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { get } from 'svelte/store';

// Import the search hidden blocks store to check visibility
let searchHiddenBlocks;
if (typeof window !== 'undefined') {
  import('../stores/searchHidden.js').then(module => {
    searchHiddenBlocks = module.searchHiddenBlocks;
  });
}

// Helper function to check if a block is hidden
function isBlockHidden(blockId) {
  if (!searchHiddenBlocks) return false;
  const hiddenSet = get(searchHiddenBlocks);
  return hiddenSet.has(blockId);
}

// Markdown serializer function outside the extension
export const serializeToMarkdown = (content) => {
  let markdown = '';
  
  const processNode = (node, depth = 0) => {
    // Skip hidden blocks entirely
    if (node.attrs && node.attrs.blockId && isBlockHidden(node.attrs.blockId)) {
      return;
    }
    
    const indent = '\t'.repeat(depth);
    
    switch (node.type.name) {
      case 'paragraph':
        // Always add a newline for paragraphs, even if empty
        const content = processTextContent(node);
        markdown += content + '\n';
        break;
        
      case 'heading':
        const level = node.attrs.level || 1;
        markdown += '#'.repeat(level) + ' ' + processTextContent(node) + '\n';
        break;
        
      case 'bulletList':
        node.content.forEach(listItem => {
          // Skip hidden list items
          if (listItem.attrs && listItem.attrs.blockId && isBlockHidden(listItem.attrs.blockId)) {
            return;
          }
          processListItem(listItem, depth, '-');
        });
        break;
        
      case 'orderedList':
        node.content.forEach((listItem, index) => {
          // Skip hidden list items
          if (listItem.attrs && listItem.attrs.blockId && isBlockHidden(listItem.attrs.blockId)) {
            return;
          }
          processListItem(listItem, depth, `${index + 1}.`);
        });
        break;
        
      case 'taskList':
        node.content.forEach(listItem => {
          // Skip hidden list items
          if (listItem.attrs && listItem.attrs.blockId && isBlockHidden(listItem.attrs.blockId)) {
            return;
          }
          const checked = listItem.attrs.checked;
          processListItem(listItem, depth, checked ? '- [x]' : '- [ ]');
        });
        break;
        
      case 'blockquote':
        const lines = node.textContent.split('\n');
        lines.forEach(line => {
          if (line.trim()) {
            markdown += '> ' + line + '\n';
          }
        });
        break;
        
      case 'codeBlock':
        markdown += '```\n' + node.textContent + '\n```\n';
        break;
        
      case 'horizontalRule':
        markdown += '---\n';
        break;
        
      case 'customListItem':
        // Skip hidden custom list items
        if (node.attrs && node.attrs.blockId && isBlockHidden(node.attrs.blockId)) {
          return;
        }
        
        const { indentLevel, listType, checkboxState } = node.attrs;
        const indent = '  '.repeat(indentLevel); // 2 spaces per indent level
        
        let marker = '- ';
        if (listType === 'checkbox') {
          const checkbox = checkboxState === 'done' ? '[x]' : 
                          checkboxState === 'dropped' ? '[-]' : '[ ]';
          marker = `- ${checkbox} `;
        }
        
        markdown += indent + marker + processTextContent(node) + '\n';
        break;
        
      default:
        // Handle other nodes including listItem
        if (node.content) {
          node.content.forEach(child => processNode(child, depth));
        }
        break;
    }
  };
  
  const processTextContent = (node) => {
    let result = '';
    
    if (node.content) {
      node.content.forEach(child => {
        if (child.type.name === 'text') {
          let text = child.text || '';
          
          // Apply marks
          if (child.marks) {
            child.marks.forEach(mark => {
              switch (mark.type.name) {
                case 'bold':
                  text = `**${text}**`;
                  break;
                case 'italic':
                  text = `*${text}*`;
                  break;
                case 'code':
                  text = `\`${text}\``;
                  break;
                case 'strike':
                  text = `~~${text}~~`;
                  break;
                case 'link':
                  text = `[${text}](${mark.attrs.href})`;
                  break;
              }
            });
          }
          
          result += text;
        } else if (child.type.name === 'mention') {
          // Handle mention nodes (hashtags)
          const label = child.attrs.label || child.attrs.id || '';
          result += `#${label}`;
        } else if (child.type.name === 'hardBreak') {
          result += '\n';
        }
      });
    }
    
    return result;
  };
  
  const processListItem = (listItem, depth, prefix) => {
    // Skip hidden list items
    if (listItem.attrs && listItem.attrs.blockId && isBlockHidden(listItem.attrs.blockId)) {
      return;
    }
    
    const indent = '\t'.repeat(depth);
    let itemText = '';
    let nestedLists = [];
    
    // First pass: extract text content and collect nested lists
    if (listItem.content) {
      listItem.content.forEach(child => {
        if (child.type.name === 'paragraph') {
          itemText += processTextContent(child);
        } else if (child.type.name === 'bulletList' || child.type.name === 'orderedList' || child.type.name === 'taskList') {
          // Collect nested lists for later processing
          nestedLists.push(child);
        }
      });
    }
    
    // Add the parent item first
    if (itemText.trim()) {
      markdown += `${indent}${prefix} ${itemText}\n`;
    }
    
    // Then process nested lists (children after parent)
    nestedLists.forEach(nestedList => {
      processNode(nestedList, depth + 1);
    });
  };
  
  if (content) {
    content.forEach(node => processNode(node));
  }
  
  // Clean up excessive newlines while preserving intentional spacing
  return markdown
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with just 2
    .trim();
};

export const MarkdownClipboard = Extension.create({
  name: 'markdownClipboard',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('markdownClipboard'),
        
        props: {
          handleDOMEvents: {
            copy: (view, event) => {
              const { from, to } = view.state.selection;
              if (from === to) return false;
              
              const slice = view.state.doc.slice(from, to);
              const markdown = serializeToMarkdown(slice.content);
              
              if (event.clipboardData) {
                event.clipboardData.setData('text/plain', markdown);
                event.preventDefault();
                return true;
              }
              
              return false;
            },
            
            cut: (view, event) => {
              const { from, to } = view.state.selection;
              if (from === to) return false;
              
              const slice = view.state.doc.slice(from, to);
              const markdown = serializeToMarkdown(slice.content);
              
              if (event.clipboardData) {
                event.clipboardData.setData('text/plain', markdown);
                view.dispatch(view.state.tr.deleteSelection());
                event.preventDefault();
                return true;
              }
              
              return false;
            },
          },
        },
      }),
    ];
  },


}); 