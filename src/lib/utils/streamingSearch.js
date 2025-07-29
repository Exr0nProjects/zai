// Streaming search system for timeline-based document filtering
// Uses search state store to show/hide blocks based on search query

import { serializeToMarkdown } from '../tiptap/MarkdownClipboard.js';
import { hideBlockInSearch, showBlockInSearch, clearSearchHiding, searchHiddenBlocks } from '../stores/searchHidden.js';
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

    console.log('🎯 Found center-screen block (avoiding hidden):', closestBlock?.blockId);
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
          console.log('🎯 Highlighted center block:', blockId);
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
        console.log('📜 Scroll detected - updating center block:', this.centerBlockId, '->', newCenterBlock.blockId);
        
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
      console.log('📜 Started scroll tracking for center block updates');
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
      console.log('📜 Stopped scroll tracking');
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
            console.log('📜 Scrolled to keep block centered:', blockId);
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
    
    console.log('🔍 Starting getAllBlocks() traversal...');
    let nodeCount = 0;
    
    this.editor.state.doc.descendants((node, pos) => {
      nodeCount++;
      
      // Only collect nodes that have block-level attributes
      if (node.attrs && node.attrs.blockId && node.attrs.createdAt) {
        // Use serializeToMarkdown for reliable text extraction (same as used elsewhere in app)
        const nodeText = serializeToMarkdown([node]).trim();
        
        const blockInfo = {
          blockId: node.attrs.blockId,
          createdAt: node.attrs.createdAt,
          parentId: node.attrs.parentId,
          nodeType: node.type.name,
          position: pos,
          content: nodeText || '',
          node: node,
        };
        
        // Log potential duplicate
        const existingBlock = blocks.find(b => b.blockId === node.attrs.blockId);
        if (existingBlock) {
          console.warn('🚨 DUPLICATE blockId detected:', {
            blockId: node.attrs.blockId,
            existing: {
              type: existingBlock.nodeType,
              pos: existingBlock.position,
              content: existingBlock.content.substring(0, 50) + '...'
            },
            new: {
              type: node.type.name,
              pos: pos,
              content: nodeText.substring(0, 50) + '...'
            }
          });
        }
        
        blocks.push(blockInfo);
      }
    });
    
    console.log(`🔍 Traversed ${nodeCount} total nodes, collected ${blocks.length} blocks with blockIds`);
    
    return blocks;
  }

  // Main search function - determines desired visibility for all blocks and sets it
  async streamSearch(query, onProgress = null) {
    console.log('🔍 StreamingSearch.streamSearch called with query:', query);
    
    // Abort any existing search
    if (this.searchAbortController) {
      this.searchAbortController.abort();
    }
    
    // Parse query
    const queryWords = this.parseQuery(query);
    console.log('🔍 Parsed query words:', queryWords);
    
    // Find center-screen block only when transitioning from empty query to non-empty
    const wasEmpty = this.currentQuery.trim() === '';
    const isNowNonEmpty = queryWords.length > 0;
    
    if (wasEmpty && isNowNonEmpty && !this.centerBlockId) {
      const centerBlock = this.findCenterScreenBlock();
      if (centerBlock) {
        this.centerBlockId = centerBlock.blockId;
        console.log('🎯 Set center block for NEW search (was empty):', this.centerBlockId);
        // Highlight the center block
        this.highlightCenterBlock(this.centerBlockId);
        // Start tracking scroll events to update center block
        this.startScrollTracking();
      }
    }
    
    this.isSearching = true;
    this.currentQuery = query;
    this.searchAbortController = new AbortController();

    try {
      // Get all blocks
      const allBlocks = this.getAllBlocks();
      console.log('📦 Found blocks:', allBlocks.length);
      
      if (allBlocks.length === 0) {
        console.log('❌ No blocks found, returning');
        return;
      }

      // Build hierarchical structure for recursive processing
      const hierarchy = this.buildHierarchy(allBlocks);
      console.log('🌳 Built hierarchy with', hierarchy.length, 'root nodes');

      let processedCount = 0;
      let matchedCount = 0;

      const processSubtree = (node, depth = 0) => {
        if (depth > 30) { // Prevent runaway recursion
          console.warn('🛑 Max depth reached, stopping recursion');
          return;
        }

        if (this.searchAbortController.signal.aborted) {
          return;
        }

        const subtreeContent = this.getSubtreeContent(node);
        const subtreeMatches = this.contentMatches(subtreeContent, queryWords);

        if (subtreeMatches) {
          this.showBlock(node.block.blockId);
          matchedCount++;
          if (node.children && node.children.length > 0) {
            for (const child of node.children) {
              processSubtree(child, depth + 1);
            }
          }
        } else {
          this.hideSubtree(node);
        }

        processedCount++;
      }
      
      // // Process hierarchy recursively with cycle detection
      // const processedNodes = new Set(); // Track processed nodes to prevent cycles
      
      // const processSubtree = (nodes, depth = 0) => {
      //   if (depth > 30) { // Prevent runaway recursion
      //     console.warn('🛑 Max depth reached, stopping recursion');
      //     return;
      //   }
        
      //   for (const node of nodes) {
      //     if (this.searchAbortController.signal.aborted) {
      //       break;
      //     }
          
      //     // Prevent cycles - skip if already processed
      //     if (processedNodes.has(node.block.blockId)) {
      //       console.log('🔄 Skipping already processed node:', node.block.blockId);
      //       continue;
      //     }
      //     processedNodes.add(node.block.blockId);

      //     // Check if this subtree contains any matches (including descendants)
      //     const subtreeContent = this.getSubtreeContent(node);
      //     const subtreeMatches = this.contentMatches(subtreeContent, queryWords);
          
      //     if (subtreeMatches) {
      //       // Subtree has matches - show this node
      //       this.showBlock(node.block.blockId);
      //       matchedCount++;
      //       console.log('✅ Subtree has matches:', node.block.blockId, node.block.nodeType);
            
      //       // Now check individual children  
      //       if (node.children && node.children.length > 0) {
      //         for (const child of node.children) {
      //           // Skip if child already processed
      //           if (processedNodes.has(child.block.blockId)) {
      //             continue;
      //           }
                
      //           // Check if this individual child matches
      //           const childContent = this.getBlockContent(child.block);
      //           const childMatches = this.contentMatches(childContent, queryWords);
                
      //           if (childMatches) {
      //             // Child matches - show it and recurse
      //             this.showBlock(child.block.blockId);
      //             console.log('✅ Child matches:', child.block.blockId, child.block.nodeType);
                  
      //             if (child.children && child.children.length > 0) {
      //               processSubtree([child], depth + 1);
      //             }
      //           } else {
      //             // Child doesn't match - hide entire child subtree
      //             this.hideSubtree(child);
      //             console.log('🙈 Child hidden (no match):', child.block.blockId, child.block.nodeType);
      //           }
      //         }
      //       }
      //     } else {
      //       // No matches in entire subtree - hide it
      //       this.hideSubtree(node);
      //       console.log('🙈 Subtree hidden (no matches):', node.block.blockId, node.block.nodeType);
      //     }
          
      //     processedCount++;
      //   }
      // };
      
      // Start recursive processing from root nodes
      for (const rootNode of hierarchy) {
        processSubtree(rootNode);
      }

      // Final progress report
      if (onProgress && !this.searchAbortController.signal.aborted) {
        onProgress({
          processed: processedCount,
          total: allBlocks.length,
          matched: matchedCount,
          query: query,
          completed: true
        });
      }

      console.log('✅ Search completed - matched:', matchedCount, 'total:', allBlocks.length);

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
    console.log('👁️ StreamingSearch.showAllBlocks called');
    clearSearchHiding();
    console.log('✅ All blocks should now be visible');
  }

  // Clear current search and show all blocks
  clearSearch() {
    console.log('🧹 StreamingSearch.clearSearch called');
    
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
    
    this.showAllBlocks();
    this.isSearching = false;
    this.currentQuery = '';
    this.centerBlockId = null; // Reset center block tracking
    
    console.log('✅ Search cleared, all blocks should be visible');
  }

  // Check if currently searching
  isActivelySearching() {
    return this.isSearching;
  }

  // Get current search query
  getCurrentQuery() {
    return this.currentQuery;
  }

  // Build hierarchical structure from flat blocks
  buildHierarchy(blocks) {
    const blockMap = new Map();
    const rootNodes = [];
    
    // Check for duplicate blockIds
    const seenIds = new Set();
    const duplicates = [];
    blocks.forEach(block => {
      if (seenIds.has(block.blockId)) {
        duplicates.push(block.blockId);
      }
      seenIds.add(block.blockId);
    });
    
    if (duplicates.length > 0) {
      console.warn('⚠️ Found duplicate blockIds:', duplicates);
    }

    // First pass: create nodes and map by blockId (use last occurrence for duplicates)
    blocks.forEach(block => {
      const node = {
        block: block,
        children: []
      };
      blockMap.set(block.blockId, node);
    });

    // Second pass: build parent-child relationships
    blocks.forEach(block => {
      const node = blockMap.get(block.blockId);
      const parentId = block.parentId;
      
      if (parentId && parentId !== 'none' && blockMap.has(parentId)) {
        // Has parent - add to parent's children
        const parent = blockMap.get(parentId);
        parent.children.push(node);
      } else {
        // No parent - is root node
        rootNodes.push(node);
      }
    });

    return rootNodes;
  }

  // Get content from entire subtree (node + all descendants) with cycle detection
  getSubtreeContent(node, visited = new Set(), depth = 0) {
    // Prevent infinite recursion from cycles or excessive depth
    if (visited.has(node.block.blockId) || depth > 5) {
      return '';
    }
    visited.add(node.block.blockId);
    
    let content = this.getBlockContent(node.block);
    
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        content += ' ' + this.getSubtreeContent(child, new Set(visited), depth + 1);
      }
    }
    
    return content;
  }

  // Get content from a single block
  getBlockContent(block) {
    try {
      return serializeToMarkdown(block.node, block.node.type.schema);
    } catch (error) {
      console.warn('Failed to serialize block to markdown:', error);
      return block.node.textContent || '';
    }
  }

  // Check if content matches query words
  contentMatches(content, queryWords) {
    const normalizedContent = content.toLowerCase();
    return queryWords.every(word => normalizedContent.includes(word));
  }

  // Hide entire subtree
  hideSubtree(node) {
    this.hideBlock(node.block.blockId);
    
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        this.hideSubtree(child);
      }
    }
  }

  // Destroy the search instance
  destroy() {
    this.clearSearch();
    this.stopScrollTracking(); // Ensure scroll tracking is cleaned up
    this.editor = null;
  }
}