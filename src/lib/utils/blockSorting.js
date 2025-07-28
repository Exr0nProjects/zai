// Utilities for sorting and managing timestamped blocks

export function getAllBlocks(editor) {
  const blocks = [];
  
  if (!editor || !editor.state) {
    return blocks;
  }
  
  editor.state.doc.descendants((node, pos) => {
    // Only collect nodes that have block-level attributes
    if (node.attrs && node.attrs.blockId && node.attrs.createdAt) {
      blocks.push({
        blockId: node.attrs.blockId,
        createdAt: node.attrs.createdAt,
        parentId: node.attrs.parentId,
        nodeType: node.type.name,
        position: pos,
        content: node.textContent || '',
        node: node,
      });
    }
  });
  
  return blocks;
}

export function sortBlocksByTimestamp(blocks, ascending = true) {
  return blocks.sort((a, b) => {
    const timestampA = new Date(a.createdAt).getTime();
    const timestampB = new Date(b.createdAt).getTime();
    
    return ascending ? timestampA - timestampB : timestampB - timestampA;
  });
}

export function getBlockHierarchy(blocks) {
  const hierarchy = [];
  const blockMap = new Map();
  
  // Create a map for quick lookup
  blocks.forEach(block => {
    blockMap.set(block.blockId, block);
  });
  
  // Build hierarchy
  blocks.forEach(block => {
    if (!block.parentId) {
      // Root level block
      hierarchy.push({
        ...block,
        children: [],
      });
    } else {
      // Child block - find parent
      const parent = blockMap.get(block.parentId);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(block);
      } else {
        // Orphaned block (parent not found) - treat as root
        hierarchy.push({
          ...block,
          children: [],
        });
      }
    }
  });
  
  return hierarchy;
}

export function findBlockById(editor, blockId) {
  let foundBlock = null;
  
  if (!editor || !editor.state) {
    return null;
  }
  
  editor.state.doc.descendants((node, pos) => {
    if (node.attrs && node.attrs.blockId === blockId) {
      foundBlock = {
        node,
        position: pos,
        blockId: node.attrs.blockId,
        createdAt: node.attrs.createdAt,
        parentId: node.attrs.parentId,
        nodeType: node.type.name,
      };
      return false; // Stop searching
    }
  });
  
  return foundBlock;
}

export function getBlockStats(blocks) {
  const stats = {
    total: blocks.length,
    byType: {},
    withParents: 0,
    orphaned: 0,
    timeRange: null,
  };
  
  blocks.forEach(block => {
    // Count by type
    stats.byType[block.nodeType] = (stats.byType[block.nodeType] || 0) + 1;
    
    // Count parent relationships
    if (block.parentId) {
      stats.withParents++;
    } else {
      stats.orphaned++;
    }
  });
  
  // Calculate time range
  if (blocks.length > 0) {
    const timestamps = blocks.map(b => new Date(b.createdAt).getTime());
    stats.timeRange = {
      earliest: new Date(Math.min(...timestamps)),
      latest: new Date(Math.max(...timestamps)),
    };
  }
  
  return stats;
} 