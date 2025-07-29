// Streaming search system for timeline-based document filtering
// Uses hidden blocks system to progressively hide non-matching blocks

export class StreamingSearch {
  constructor(editor, hiddenBlocksPlugin) {
    this.editor = editor;
    this.hiddenBlocksPlugin = hiddenBlocksPlugin;
    this.isSearching = false;
    this.searchAbortController = null;
    this.currentQuery = '';
    this.hiddenBlockIds = new Set();
  }

  // Parse search query into individual words (space-separated)
  parseQuery(query) {
    return query.toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  // Check if a block's text content matches all query words
  blockMatches(block, queryWords) {
    if (queryWords.length === 0) return true;
    
    const blockText = block.content.toLowerCase();
    return queryWords.every(word => blockText.includes(word));
  }

  // Get current timestamp for bidirectional search from "now"
  getCurrentTimestamp() {
    return Date.now();
  }

  // Sort blocks by distance from present time (closest first)
  sortBlocksByTimeDistance(blocks, currentTime) {
    return blocks.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      const distanceA = Math.abs(currentTime - timeA);
      const distanceB = Math.abs(currentTime - timeB);
      return distanceA - distanceB;
    });
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
          content: node.textContent || '',
          node: node,
        });
      }
    });
    
    return blocks;
  }

  // Stream search with progressive hiding
  async streamSearch(query, onProgress = null) {
    // Clear any existing search
    this.clearSearch();
    
    // Parse query
    const queryWords = this.parseQuery(query);
    if (queryWords.length === 0) {
      // Empty query - show all blocks
      this.showAllBlocks();
      return;
    }

    this.isSearching = true;
    this.currentQuery = query;
    this.searchAbortController = new AbortController();
    this.hiddenBlockIds.clear();

    try {
      // Get all blocks
      const allBlocks = this.getAllBlocks();
      if (allBlocks.length === 0) return;

      // Sort blocks by distance from current time (bidirectional search)
      const currentTime = this.getCurrentTimestamp();
      const sortedBlocks = this.sortBlocksByTimeDistance(allBlocks, currentTime);

      let processedCount = 0;
      let matchedCount = 0;
      
      // Process blocks in chunks to avoid blocking UI
      const chunkSize = 10;
      for (let i = 0; i < sortedBlocks.length; i += chunkSize) {
        // Check if search was aborted
        if (this.searchAbortController.signal.aborted) {
          break;
        }

        const chunk = sortedBlocks.slice(i, i + chunkSize);
        
        // Process chunk
        for (const block of chunk) {
          if (this.searchAbortController.signal.aborted) {
            break;
          }

          const matches = this.blockMatches(block, queryWords);
          
          if (!matches) {
            // Hide block immediately
            this.hideBlock(block.blockId);
            this.hiddenBlockIds.add(block.blockId);
          } else {
            matchedCount++;
          }
          
          processedCount++;
        }

        // Report progress
        if (onProgress) {
          onProgress({
            processed: processedCount,
            total: sortedBlocks.length,
            matched: matchedCount,
            query: query
          });
        }

        // Yield control to prevent blocking UI
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      // Final progress report
      if (onProgress && !this.searchAbortController.signal.aborted) {
        onProgress({
          processed: processedCount,
          total: sortedBlocks.length,
          matched: matchedCount,
          query: query,
          completed: true
        });
      }

    } catch (error) {
      console.error('Search error:', error);
    } finally {
      if (this.currentQuery === query) {
        this.isSearching = false;
      }
    }
  }

  // Hide a specific block
  hideBlock(blockId) {
    if (this.editor && this.editor.commands) {
      this.editor.commands.hideBlock(blockId);
    }
  }

  // Show all blocks (clear search)
  showAllBlocks() {
    if (this.editor && this.editor.commands) {
      this.editor.commands.showAllBlocks();
    }
    this.hiddenBlockIds.clear();
  }

  // Clear current search
  clearSearch() {
    if (this.searchAbortController) {
      this.searchAbortController.abort();
    }
    
    if (this.isSearching) {
      this.showAllBlocks();
      this.isSearching = false;
      this.currentQuery = '';
    }
  }

  // Check if currently searching
  isActivelySearching() {
    return this.isSearching;
  }

  // Get current search query
  getCurrentQuery() {
    return this.currentQuery;
  }

  // Get count of hidden blocks
  getHiddenBlockCount() {
    return this.hiddenBlockIds.size;
  }

  // Destroy the search instance
  destroy() {
    this.clearSearch();
    this.editor = null;
    this.hiddenBlocksPlugin = null;
  }
}