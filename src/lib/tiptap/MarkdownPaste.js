import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

// Helper functions outside the extension to avoid scope issues
const isMarkdown = (text) => {
  // Check for common markdown patterns
  const markdownPatterns = [
    /^#{1,6}\s+/m,           // Headings
    /^[-*+]\s+/m,            // Bullet lists
    /^[-*+]\s+\[[ x]\]/m,    // Task lists
    /^\d+\.\s+/m,            // Ordered lists
    /^\t*[-*+]\s+/m,         // Indented lists
    /\*\*.*\*\*/,            // Bold
    /\*.*\*/,                // Italic
    /`.*`/,                  // Code
    /^>\s+/m,                // Blockquotes
  ];
  
  return markdownPatterns.some(pattern => pattern.test(text));
};

const getIndentLevel = (line) => {
  const match = line.match(/^(\t*)/);
  return match ? match[1].length : 0;
};

const parseInlineMarkdown = (text, schema) => {
  const nodes = [];
  let remainingText = text;
  
  // For now, just create a simple text node
  // TODO: Parse inline formatting properly with bold, italic, code, etc.
  if (remainingText.trim()) {
    nodes.push(schema.text(remainingText));
  }
  
  return nodes;
};

const parseList = (lines, startIndex, listType, schema) => {
  const nodes = [];
  let i = startIndex;
  const baseIndent = getIndentLevel(lines[i]);
  
  // Collect all items at this level
  const listItems = [];
  
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    
    const indent = getIndentLevel(line);
    
    // If we've gone back to a less indented level, stop
    if (indent < baseIndent) {
      break;
    }
    
    let match;
    if (listType === 'task') {
      match = line.match(/^(\t*)([-*+])\s+\[([x ])\]\s*(.*)$/);
    } else if (listType === 'bullet') {
      match = line.match(/^(\t*)([-*+])\s+(.*)$/);
    } else if (listType === 'ordered') {
      match = line.match(/^(\t*)(\d+)\.\s+(.*)$/);
    }
    
    if (match && indent === baseIndent) {
      // This is an item at our level
      const text = listType === 'task' ? match[4] : match[3];
      const checked = listType === 'task' ? match[3] === 'x' : undefined;
      
      listItems.push({
        text: text,
        checked: checked,
        index: i,
      });
    }
    
    i++;
  }
  
  // Create the list
  if (listItems.length > 0) {
    const listItemNodes = listItems.map(item => {
      const attrs = listType === 'task' ? { checked: item.checked } : {};
      const inlineContent = parseInlineMarkdown(item.text, schema);
      
      if (listType === 'task') {
        return schema.nodes.taskItem.create(attrs, [
          schema.nodes.paragraph.create({}, inlineContent)
        ]);
      } else {
        return schema.nodes.listItem.create(attrs, [
          schema.nodes.paragraph.create({}, inlineContent)
        ]);
      }
    });
    
    if (listType === 'task') {
      nodes.push(schema.nodes.taskList.create({}, listItemNodes));
    } else if (listType === 'bullet') {
      nodes.push(schema.nodes.bulletList.create({}, listItemNodes));
    } else if (listType === 'ordered') {
      nodes.push(schema.nodes.orderedList.create({}, listItemNodes));
    }
  }
  
  return { listNodes: nodes, nextIndex: i };
};

const parseMarkdown = (text, schema) => {
  const lines = text.split('\n');
  const nodes = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Skip empty lines
    if (!line.trim()) {
      i++;
      continue;
    }
    
    // Parse headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      nodes.push(schema.nodes.heading.create(
        { level },
        schema.text(text)
      ));
      i++;
      continue;
    }
    
    // Parse task lists
    const taskMatch = line.match(/^(\t*)([-*+])\s+\[([x ])\]\s*(.*)$/);
    if (taskMatch) {
      const { listNodes, nextIndex } = parseList(lines, i, 'task', schema);
      nodes.push(...listNodes);
      i = nextIndex;
      continue;
    }
    
    // Parse bullet lists
    const bulletMatch = line.match(/^(\t*)([-*+])\s+(.*)$/);
    if (bulletMatch) {
      const { listNodes, nextIndex } = parseList(lines, i, 'bullet', schema);
      nodes.push(...listNodes);
      i = nextIndex;
      continue;
    }
    
    // Parse ordered lists
    const orderedMatch = line.match(/^(\t*)(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      const { listNodes, nextIndex } = parseList(lines, i, 'ordered', schema);
      nodes.push(...listNodes);
      i = nextIndex;
      continue;
    }
    
    // Parse blockquotes
    const quoteMatch = line.match(/^>\s*(.*)$/);
    if (quoteMatch) {
      const text = quoteMatch[1];
      nodes.push(schema.nodes.blockquote.create(
        {},
        schema.nodes.paragraph.create({}, parseInlineMarkdown(text, schema))
      ));
      i++;
      continue;
    }
    
    // Parse regular paragraphs
    const inlineContent = parseInlineMarkdown(line, schema);
    if (inlineContent.length > 0) {
      nodes.push(schema.nodes.paragraph.create({}, inlineContent));
    }
    i++;
  }
  
  return nodes;
};

export const MarkdownPaste = Extension.create({
  name: 'markdownPaste',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('markdownPaste'),
        
        props: {
          handlePaste: (view, event, slice) => {
            const clipboardData = event.clipboardData;
            if (!clipboardData) return false;
            
            const text = clipboardData.getData('text/plain');
            if (!text) return false;
            
            // Check if the text looks like markdown
            if (isMarkdown(text)) {
              const nodes = parseMarkdown(text, view.state.schema);
              if (nodes.length > 0) {
                const { tr } = view.state;
                let { from } = view.state.selection;
                
                // Insert the parsed nodes sequentially, updating position after each insert
                nodes.forEach((node) => {
                  tr.insert(from, node);
                  from += node.nodeSize; // Update position for next insertion
                });
                
                view.dispatch(tr);
                return true;
              }
            }
            
            return false;
          },
        },
      }),
    ];
  },

}); 