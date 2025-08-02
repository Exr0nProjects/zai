import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { generateBlockId, getCurrentTimestamp } from '../utils/snowflake.js';

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
  
  // Parse hashtags first to convert them to mention nodes
  const hashtagRegex = /(?:^|\s)(#([a-zA-Z0-9_-]{2,}))(?=\s|$|[^\w-])/g;
  let lastIndex = 0;
  let match;
  
  while ((match = hashtagRegex.exec(remainingText)) !== null) {
    const beforeTag = remainingText.slice(lastIndex, match.index);
    const fullMatch = match[1]; // #hashtag
    const tagName = match[2]; // hashtag
    const startsWithSpace = match[0].startsWith(' ');
    
    // Add text before the tag
    if (beforeTag || startsWithSpace) {
      const textToAdd = beforeTag + (startsWithSpace ? ' ' : '');
      if (textToAdd) {
        nodes.push(schema.text(textToAdd));
      }
    }
    
    // Add mention node for hashtag
    if (schema.nodes.mention) {
      nodes.push(schema.nodes.mention.create({
        id: tagName.toLowerCase(),
        label: tagName.toLowerCase()
      }));
    } else {
      // Fallback if mention node not available
      nodes.push(schema.text(fullMatch));
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after last hashtag
  const finalText = remainingText.slice(lastIndex);
  if (finalText.trim()) {
    nodes.push(schema.text(finalText));
  }
  
  // If no hashtags found, just create a simple text node
  if (nodes.length === 0 && remainingText.trim()) {
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

// Helper function to calculate parent ID for markdown structure
const calculateParentId = (nodeIndex, nodeInfos, currentNode) => {
  if (nodeIndex === 0) {
    return null; // First node will get assigned proper parent when inserted
  }
  
  // Look backwards for the appropriate parent
  for (let j = nodeIndex - 1; j >= 0; j--) {
    const candidateNode = nodeInfos[j];
    
    // If candidate is at lesser indent level, it's our parent
    if (candidateNode.indentLevel <= currentNode.indentLevel) {
      return candidateNode.blockId;
    } else {
      return candidateNode.blockId; // hit something not a bullet or task, so use it as parent
    }
  }
  
  return null; // No parent found in markdown structure
};

const parseMarkdown = (text, schema) => {
  const lines = text.split('\n');
  const nodes = [];
  const nodeInfos = []; // Track node metadata for parent calculation
  let i = 0;
  
  // Track indentation levels for dynamic bullet list parsing
  const indentLevelMap = new Map(); // space count -> logical level
  let currentLogicalLevel = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Create empty paragraphs for empty lines
    if (!line.trim()) {
      const blockId = generateBlockId();
      const createdAt = getCurrentTimestamp();
      const nodeInfo = { type: 'paragraph', blockId, indentLevel: 0 };
      const parentId = calculateParentId(nodeInfos.length, nodeInfos, nodeInfo);
      
      nodeInfos.push(nodeInfo);
      nodes.push(schema.nodes.paragraph.create({
        blockId,
        createdAt,
        parentId,
        children: []
      }, []));
      i++;
      continue;
    }
    
    // Parse headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const blockId = generateBlockId();
      const createdAt = getCurrentTimestamp();
      const nodeInfo = { type: 'heading', blockId, indentLevel: 0 };
      const parentId = calculateParentId(nodeInfos.length, nodeInfos, nodeInfo);
      
      nodeInfos.push(nodeInfo);
      nodes.push(schema.nodes.heading.create({
        level,
        blockId,
        createdAt,
        parentId,
        children: []
      }, schema.text(text)));
      i++;
      continue;
    }
    
    // Parse task lists (checkbox lists) - convert to customListItem
    const taskMatch = line.match(/^(\s*)([-*+])\s*\[([x\- ])\]\s*(.*)$/);
    if (taskMatch) {
      const spaceCount = taskMatch[1].length;
      const checkboxChar = taskMatch[3];
      const text = taskMatch[4];
      
      // Dynamic indentation level calculation (same logic as bullet lists)
      let indentLevel = 0;
      if (spaceCount === 0) {
        indentLevel = 0;
        indentLevelMap.set(0, 0);
      } else if (indentLevelMap.has(spaceCount)) {
        // Known indentation level
        indentLevel = indentLevelMap.get(spaceCount);
      } else {
        // New indentation level - find the appropriate logical level
        const existingLevels = Array.from(indentLevelMap.keys()).sort((a, b) => a - b);
        let foundLevel = 0;
        
        for (let i = existingLevels.length - 1; i >= 0; i--) {
          const existingSpaceCount = existingLevels[i];
          if (spaceCount >= existingSpaceCount + 2) {
            foundLevel = indentLevelMap.get(existingSpaceCount) + 1;
            break;
          }
        }
        
        indentLevel = foundLevel;
        indentLevelMap.set(spaceCount, indentLevel);
        currentLogicalLevel = Math.max(currentLogicalLevel, indentLevel);
      }
      
      let checkboxState = 'todo';
      if (checkboxChar === 'x' || checkboxChar === 'X') checkboxState = 'done';
      else if (checkboxChar === '-') checkboxState = 'dropped';
      
      const blockId = generateBlockId();
      const createdAt = getCurrentTimestamp();
      const nodeInfo = { type: 'task', blockId, indentLevel };
      const parentId = calculateParentId(nodeInfos.length, nodeInfos, nodeInfo);
      
      nodeInfos.push(nodeInfo);
      const inlineContent = parseInlineMarkdown(text, schema);
      nodes.push(schema.nodes.customListItem.create({
        listType: 'checkbox',
        indentLevel,
        checkboxState,
        blockId,
        createdAt,
        parentId,
        children: []
      }, inlineContent));
      
      i++;
      continue;
    }
    
    // Parse bullet lists - convert to customListItem
    const bulletMatch = line.match(/^(\s*)([-*+])\s*(.*)$/);
    if (bulletMatch && !taskMatch) { // Make sure it's not a task list
      const spaceCount = bulletMatch[1].length;
      const text = bulletMatch[3];
      
      // Dynamic indentation level calculation
      let indentLevel = 0;
      if (spaceCount === 0) {
        indentLevel = 0;
        indentLevelMap.set(0, 0);
      } else if (indentLevelMap.has(spaceCount)) {
        // Known indentation level
        indentLevel = indentLevelMap.get(spaceCount);
      } else {
        // New indentation level - find the appropriate logical level
        const existingLevels = Array.from(indentLevelMap.keys()).sort((a, b) => a - b);
        let foundLevel = 0;
        
        for (let i = existingLevels.length - 1; i >= 0; i--) {
          const existingSpaceCount = existingLevels[i];
          if (spaceCount >= existingSpaceCount + 2) {
            foundLevel = indentLevelMap.get(existingSpaceCount) + 1;
            break;
          }
        }
        
        indentLevel = foundLevel;
        indentLevelMap.set(spaceCount, indentLevel);
        currentLogicalLevel = Math.max(currentLogicalLevel, indentLevel);
      }
      
      const blockId = generateBlockId();
      const createdAt = getCurrentTimestamp();
      const nodeInfo = { type: 'bullet', blockId, indentLevel };
      const parentId = calculateParentId(nodeInfos.length, nodeInfos, nodeInfo);
      
      nodeInfos.push(nodeInfo);
      const inlineContent = parseInlineMarkdown(text, schema);
      nodes.push(schema.nodes.customListItem.create({
        listType: 'bullet',
        indentLevel,
        blockId,
        createdAt,
        parentId,
        children: []
      }, inlineContent));
      
      i++;
      continue;
    }
    
    // Parse blockquotes
    const quoteMatch = line.match(/^>\s*(.*)$/);
    if (quoteMatch) {
      const text = quoteMatch[1];
      const blockId = generateBlockId();
      const createdAt = getCurrentTimestamp();
      const nodeInfo = { type: 'blockquote', blockId, indentLevel: 0 };
      const parentId = calculateParentId(nodeInfos.length, nodeInfos, nodeInfo);
      
      nodeInfos.push(nodeInfo);
      nodes.push(schema.nodes.blockquote.create({
        blockId,
        createdAt,
        parentId,
        children: []
      }, schema.nodes.paragraph.create({}, parseInlineMarkdown(text, schema))));
      i++;
      continue;
    }
    
    // Parse regular paragraphs
    const inlineContent = parseInlineMarkdown(line, schema);
    if (inlineContent.length > 0) {
      const blockId = generateBlockId();
      const createdAt = getCurrentTimestamp();
      const nodeInfo = { type: 'paragraph', blockId, indentLevel: 0 };
      const parentId = calculateParentId(nodeInfos.length, nodeInfos, nodeInfo);
      
      nodeInfos.push(nodeInfo);
      nodes.push(schema.nodes.paragraph.create({
        blockId,
        createdAt,
        parentId,
        children: []
      }, inlineContent));
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