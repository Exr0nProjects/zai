// Streaming search system for timeline-based document filtering
// Uses search state store to show/hide blocks based on search query

const LOG = false;

import { serializeToMarkdown } from '../tiptap/MarkdownClipboard.js';
import { hideBlockInSearch, showBlockInSearch, clearSearchHiding, searchHiddenBlocks } from '../stores/searchHidden.js';
import { setSearchHighlight, clearSearchHighlight } from '../tiptap/SearchHighlightPlugin.js';
import { get } from 'svelte/store';

export class StreamingSearch {
  constructor(editor) {
    this.editor = editor;
    this.isSearching = false;
    this.searchAbortController = null;
    this.currentQuery = '';
    this.centerBlockId = null; // Block to keep centered during search
    this.scrollTimeout = null; // Debounce scroll updates
    this.isScrollHandlerActive = false;
  }

  // Parse search query into individual words (space-separated, case insensitive)
  parseQuery(query) {
    return query.toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  // Get current timestamp for bidirectional search from "now"
  getCurrentTimestamp() {
    return Date.now();
  }

  // Find the block that's currently closest to center-screen (avoiding hidden blocks)
  findCenterScreenBlock() {
    if (!this.editor || !this.editor.view) {
      return null;
    }

    const allBlocks = this.getAllBlocks();
    if (allBlocks.length === 0) {
      return null;
    }

    // Get viewport center
    const viewportHeight = window.innerHeight;
    const viewportCenter = viewportHeight / 2;
    
    let closestBlock = null;
    let closestDistance = Infinity;

    // Find block whose DOM element is closest to viewport center
    for (const block of allBlocks) {
      try {
        // Skip search-hidden blocks - don't use them as center reference
        const hiddenSet = get(searchHiddenBlocks);
        if (hiddenSet.has(block.blockId)) {
          continue;
        }

        // Get DOM node for this block position
        const domAtPos = this.editor.view.domAtPos(block.position);
        if (domAtPos && domAtPos.node) {
          let element = domAtPos.node;
          
          // Find the actual block element
          if (element.nodeType === Node.TEXT_NODE) {
            element = element.parentElement;
          }
          
          // Find the block-level element with the blockId
          while (element && !element.hasAttribute?.('data-block-id')) {
            element = element.parentElement;
          }
          
          if (element) {
            // Double-check the element isn't hidden in DOM (additional safety)
            if (element.classList.contains('hidden-block')) {
              continue;
            }

            const rect = element.getBoundingClientRect();
            const elementCenter = rect.top + rect.height / 2;
            const distance = Math.abs(elementCenter - viewportCenter);
            
            if (distance < closestDistance) {
              closestDistance = distance;
              closestBlock = block;
            }
          }
        }
      } catch (error) {
        // Skip blocks that cause errors
        continue;
      }
    }

    return closestBlock;
  }

  // Add highlighting to the center-tracked block
  highlightCenterBlock(blockId) {
    if (!this.editor || !this.editor.view || !blockId) {
      return;
    }

    try {
      // Remove previous highlighting
      this.removeCenterBlockHighlight();

      // Find the block in our current document
      const allBlocks = this.getAllBlocks();
      const targetBlock = allBlocks.find(b => b.blockId === blockId);
      
      if (!targetBlock) {
        return;
      }

      // Get DOM position for the block
      const domAtPos = this.editor.view.domAtPos(targetBlock.position);
      if (domAtPos && domAtPos.node) {
        let element = domAtPos.node;
        
        // Find the actual block element
        if (element.nodeType === Node.TEXT_NODE) {
          element = element.parentElement;
        }
        
        // Find the block-level element
        while (element && !element.hasAttribute?.('data-block-id')) {
          element = element.parentElement;
        }
        
        if (element) {
          element.classList.add('search-center-block');
          if (LOG) console.log('🎯 Highlighted center block:', blockId);
        }
      }
    } catch (error) {
      console.error('Error highlighting center block:', error);
    }
  }

  // Remove highlighting from all blocks
  removeCenterBlockHighlight() {
    if (!this.editor || !this.editor.view) {
      return;
    }

    try {
      const highlightedElements = this.editor.view.dom.querySelectorAll('.search-center-block');
      highlightedElements.forEach(el => {
        el.classList.remove('search-center-block');
      });
    } catch (error) {
      console.error('Error removing center block highlight:', error);
    }
  }

  // Handle scroll events to update center block tracking
  handleScroll = () => {
    // Only update center block if we're currently in an active search
    if (!this.currentQuery.trim() || !this.isSearching) {
      return;
    }

    // Debounce scroll updates to avoid excessive computation
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      const newCenterBlock = this.findCenterScreenBlock();
      if (newCenterBlock && newCenterBlock.blockId !== this.centerBlockId) {
        if (LOG) console.log('📜 Scroll detected - updating center block:', this.centerBlockId, '->', newCenterBlock.blockId);
        
        // Remove old highlight and add new one
        this.removeCenterBlockHighlight();
        this.centerBlockId = newCenterBlock.blockId;
        this.highlightCenterBlock(this.centerBlockId);
      }
    }, 150); // 150ms debounce
  };

  // Start listening for scroll events
  startScrollTracking() {
    if (!this.isScrollHandlerActive) {
      window.addEventListener('scroll', this.handleScroll, { passive: true });
      this.isScrollHandlerActive = true;
      if (LOG) console.log('📜 Started scroll tracking for center block updates');
    }
  }

  // Stop listening for scroll events
  stopScrollTracking() {
    if (this.isScrollHandlerActive) {
      window.removeEventListener('scroll', this.handleScroll);
      this.isScrollHandlerActive = false;
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = null;
      }
      if (LOG) console.log('📜 Stopped scroll tracking');
    }
  }

  // Scroll to keep a specific block centered (even if hidden)
  scrollToKeepBlockCentered(blockId) {
    if (!this.editor || !this.editor.view || !blockId) {
      return;
    }

    try {
      // Find the block in our current document
      const allBlocks = this.getAllBlocks();
      const targetBlock = allBlocks.find(b => b.blockId === blockId);
      
      if (!targetBlock) {
        console.log('❌ Target block not found for scrolling:', blockId);
        return;
      }

      // Get DOM position for the block
      const domAtPos = this.editor.view.domAtPos(targetBlock.position);
      if (domAtPos && domAtPos.node) {
        let element = domAtPos.node;
        
        // Find the actual block element
        if (element.nodeType === Node.TEXT_NODE) {
          element = element.parentElement;
        }
        
        // Find the block-level element
        while (element && !element.hasAttribute?.('data-block-id')) {
          element = element.parentElement;
        }
        
        if (element) {
          // Scroll to center this element
          const rect = element.getBoundingClientRect();
          const viewportCenter = window.innerHeight / 2;
          const elementCenter = rect.top + rect.height / 2;
          const scrollOffset = elementCenter - viewportCenter;
          
          if (Math.abs(scrollOffset) > 10) { // Only scroll if significantly off-center
            window.scrollBy({
              top: scrollOffset,
              behavior: 'smooth'
            });
            if (LOG) console.log('📜 Scrolled to keep block centered:', blockId);
          }
        }
      }
    } catch (error) {
      console.error('Error scrolling to block:', error);
    }
  }

  // Get all blocks from the editor
  getAllBlocks() {
    const blocks = [];
    
    if (!this.editor || !this.editor.state) {
      return blocks;
    }
    
    this.editor.state.doc.descendants((node, pos) => {
      // Only collect nodes that have block-level attributes
      if (node.attrs && node.attrs.blockId && node.attrs.createdAt) {
        blocks.push({
          blockId: node.attrs.blockId,
          createdAt: node.attrs.createdAt,
          parentId: node.attrs.parentId,
          nodeType: node.type.name,
          position: pos,
          node: node,
        });
      }
    });
    
    return blocks;
  }

  // Main search function - determines desired visibility for all blocks and sets it
  async streamSearch(query, onProgress = null) {
    if (LOG) console.log('🔍 StreamingSearch.streamSearch called with query:', query);
    
    // Abort any existing search
    if (this.searchAbortController) {
      this.searchAbortController.abort();
    }
    
    // Parse query
    const queryWords = this.parseQuery(query);
    if (LOG) console.log('🔍 Parsed query words:', queryWords);
    
    // Find center-screen block only when transitioning from empty query to non-empty
    const wasEmpty = this.currentQuery.trim() === '';
    const isNowNonEmpty = queryWords.length > 0;
    
    if (wasEmpty && isNowNonEmpty && !this.centerBlockId) {
      const centerBlock = this.findCenterScreenBlock();
      if (centerBlock) {
        this.centerBlockId = centerBlock.blockId;
        // Highlight the center block
        this.highlightCenterBlock(this.centerBlockId);
        // Start tracking scroll events to update center block
        this.startScrollTracking();
      }
    }
    
    this.isSearching = true;
    this.currentQuery = query;
    this.searchAbortController = new AbortController();

    // Set search highlighting
    setSearchHighlight(query);

    try {
      let processedCount = 0;
      let matchedCount = 0;

      // Two-pass algorithm for proper parent visibility
      const shouldShowBlocks = new Set(); // Blocks that should be visible
      const allNodes = []; // Store all nodes for second pass

      // First pass: Find all matching nodes and mark ancestors for visibility
      const collectMatches = (node, pos, depth = 0) => {
        if (depth > 30) {
          console.warn('🛑 SEARCH Max depth reached, stopping recursion');
          return;
        }

        if (this.searchAbortController.signal.aborted) {
          return;
        }

        // Store node info for second pass
        if (node.attrs && node.attrs.blockId) {
          allNodes.push({ node, pos, depth });
          
          const nodeContent = this.getNodeContent(node);
          const nodeMatches = this.contentMatches(nodeContent, queryWords);
          const subtreeMatches = nodeMatches || this.hasMatchingDescendants(node, queryWords);

          if (subtreeMatches) {
            // This node should be shown, and so should all its ancestors and children
            this.markAncestorsForVisibility(node, pos, shouldShowBlocks);
            shouldShowBlocks.add(node.attrs.blockId);
            // Also mark all children (and their descendants) for visibility
            this.markChildrenForVisibility(node.attrs.blockId, shouldShowBlocks, allNodes);
            matchedCount++;
          }

          processedCount++;
        }

        // Recurse into children
        let childPos = pos + 1;
        node.content.forEach((child, index) => {
          collectMatches(child, childPos, depth + 1);
          childPos += child.nodeSize;
        });
      };

      // Start first pass from document root
      let rootPos = 0;
      this.editor.state.doc.content.forEach((child, index) => {
        collectMatches(child, rootPos, 0);
        rootPos += child.nodeSize;
      });

      // Second pass: Apply show/hide decisions
      for (const { node } of allNodes) {
        if (shouldShowBlocks.has(node.attrs.blockId)) {
          this.showBlock(node.attrs.blockId);
          if (LOG) console.log('✅ Block should be visible:', node.attrs.blockId, node.type.name);
        } else {
          this.hideBlock(node.attrs.blockId);
          if (LOG) console.log('🙈 Block should be hidden:', node.attrs.blockId, node.type.name);
        }
      }

      // Final progress report
      if (onProgress && !this.searchAbortController.signal.aborted) {
        onProgress({
          processed: processedCount,
          total: processedCount,
          matched: matchedCount,
          query: query,
          completed: true
        });
      }

      if (LOG) console.log('✅ Search completed - matched:', matchedCount, 'total:', processedCount);

      // Scroll to keep the center block centered after search updates
      if (this.centerBlockId) {
        this.scrollToKeepBlockCentered(this.centerBlockId);
      }

    } catch (error) {
      console.error('Search error:', error);
    } finally {
      if (this.currentQuery === query) {
        this.isSearching = false;
      }
    }
  }

  // Hide a specific block during search
  hideBlock(blockId) {
    hideBlockInSearch(blockId);
  }

  // Show a specific block during search
  showBlock(blockId) {
    showBlockInSearch(blockId);
  }

  // Show all blocks (used when clearing search)
  showAllBlocks() {
    if (LOG) console.log('👁️ StreamingSearch.showAllBlocks called');
    clearSearchHiding();
    if (LOG) console.log('✅ All blocks should now be visible');
  }

  // Clear current search and show all blocks
  clearSearch() {
    if (LOG) console.log('🧹 StreamingSearch.clearSearch called');
    
    if (this.searchAbortController) {
      this.searchAbortController.abort();
    }
    
    // Scroll to center block before clearing (while we still have the reference)
    if (this.centerBlockId) {
      this.scrollToKeepBlockCentered(this.centerBlockId);
    }
    
    // Stop scroll tracking since search is ending
    this.stopScrollTracking();
    
    // Remove center block highlighting
    this.removeCenterBlockHighlight();
    
    // Clear search highlighting
    clearSearchHighlight();
    
    this.showAllBlocks();
    this.isSearching = false;
    this.currentQuery = '';
    this.centerBlockId = null; // Reset center block tracking
    
    if (LOG) console.log('✅ Search cleared, all blocks should be visible');
  }

  // Check if currently searching
  isActivelySearching() {
    return this.isSearching;
  }

  // Get current search query
  getCurrentQuery() {
    return this.currentQuery;
  }

  // Check if any descendants of a node match the query
  hasMatchingDescendants(node, queryWords) {
    let hasMatch = false;
    
    node.descendants((descendant) => {
      if (hasMatch) return false; // Early exit if we found a match
      
      if (descendant.attrs && descendant.attrs.blockId) {
        const content = this.getNodeContent(descendant);
        if (this.contentMatches(content, queryWords)) {
          hasMatch = true;
          return false; // Stop traversing
        }
      }
    });
    
    return hasMatch;
  }

  // Mark all children of a matching node for visibility (recursive)
  markChildrenForVisibility(blockId, shouldShowBlocks, allNodes, visited = new Set()) {
    // Prevent infinite recursion
    if (visited.has(blockId)) {
      return;
    }
    visited.add(blockId);
    
    // Find the node with this blockId
    const nodeInfo = allNodes.find(n => n.node.attrs?.blockId === blockId);
    if (!nodeInfo || !nodeInfo.node.attrs?.children) {
      return;
    }
    
    const children = nodeInfo.node.attrs.children;
    if (Array.isArray(children)) {
      for (const childId of children) {
        shouldShowBlocks.add(childId);
        if (LOG) console.log('👶 Marking child for visibility:', childId);
        
        // Recursively mark grandchildren
        this.markChildrenForVisibility(childId, shouldShowBlocks, allNodes, visited);
      }
    }
  }

  // Mark all ancestors of a matching node for visibility
  markAncestorsForVisibility(node, pos, shouldShowBlocks) {
    // Walk up the document tree from this position
    const $pos = this.editor.state.doc.resolve(pos);
    
    for (let depth = $pos.depth; depth >= 0; depth--) {
      const ancestorNode = $pos.node(depth);
      if (ancestorNode.attrs && ancestorNode.attrs.blockId) {
        shouldShowBlocks.add(ancestorNode.attrs.blockId);
        if (LOG) console.log('👆 Marking ancestor for visibility:', ancestorNode.attrs.blockId, ancestorNode.type.name);
        
        // If this ancestor is a list, also mark its previous sibling for visibility
        if (this.isListNode(ancestorNode)) {
          const prevSibling = this.findPreviousSibling($pos, depth);
          if (prevSibling && prevSibling.attrs && prevSibling.attrs.blockId) {
            shouldShowBlocks.add(prevSibling.attrs.blockId);
            if (LOG) console.log('👈 Marking previous sibling of list for visibility:', prevSibling.attrs.blockId, prevSibling.type.name);
          }
        }
      }
    }
  }

  // Check if a node is a list type (bullet list, ordered list, or task list)
  isListNode(node) {
    return node.type.name === 'bulletList' || 
           node.type.name === 'orderedList' || 
           node.type.name === 'taskList';
  }

  // Find the previous sibling of a node at a specific depth
  findPreviousSibling($pos, depth) {
    if (depth <= 0) return null;
    
    try {
      // Get the parent node and the position within it
      const parent = $pos.node(depth - 1);
      const indexInParent = $pos.index(depth - 1);
      
      // Check if there's a previous sibling
      if (indexInParent > 0) {
        const prevSibling = parent.child(indexInParent - 1);
        return prevSibling;
      }
    } catch (error) {
      if (LOG) console.warn('Error finding previous sibling:', error);
    }
    
    return null;
  }

  // Get content from a single node using serializeToMarkdown
  getNodeContent(node) {
    try {
      return serializeToMarkdown([node]).trim();
    } catch (error) {
      console.warn('Failed to serialize node to markdown:', error);
      return node.textContent || '';
    }
  }

  // Check if content matches query words
  contentMatches(content, queryWords) {
    const normalizedContent = content.toLowerCase();
    return queryWords.every(word => normalizedContent.includes(word));
  }

  // Destroy the search instance
  destroy() {
    this.clearSearch();
    this.stopScrollTracking(); // Ensure scroll tracking is cleaned up
    this.editor = null;
  }
}