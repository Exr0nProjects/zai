// Streaming search system for timeline-based document filtering
// Uses hidden blocks system to show/hide blocks based on search query

export class StreamingSearch {
  constructor(editor, hiddenBlocksPlugin) {
    this.editor = editor;
    this.hiddenBlocksPlugin = hiddenBlocksPlugin;
    this.isSearching = false;
    this.searchAbortController = null;
    this.currentQuery = '';
  }

  // Parse search query into individual words (space-separated, case insensitive)
  parseQuery(query) {
    return query.toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  // Check if a block's text content matches all query words
  blockMatches(block, queryWords) {
    if (queryWords.length === 0) return true; // Empty query matches everything
    
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

      // Sort blocks by distance from current time (process closest to "now" first)
      const currentTime = this.getCurrentTimestamp();
      const sortedBlocks = this.sortBlocksByTimeDistance(allBlocks, currentTime);

      let processedCount = 0;
      let matchedCount = 0;
      
      // Process blocks in chunks to avoid blocking UI
      const chunkSize = 10;
      for (let i = 0; i < sortedBlocks.length; i += chunkSize) {
        // Check if search was aborted
        if (this.searchAbortController.signal.aborted) {
          console.log('🛑 Search aborted');
          break;
        }

        const chunk = sortedBlocks.slice(i, i + chunkSize);
        
        // Process chunk - determine desired visibility for each block
        for (const block of chunk) {
          if (this.searchAbortController.signal.aborted) {
            break;
          }

          const shouldBeVisible = this.blockMatches(block, queryWords);
          
          if (shouldBeVisible) {
            // Block should be visible - ensure it's shown
            this.showBlock(block.blockId);
            matchedCount++;
            console.log('✅ Block should be visible:', block.blockId);
          } else {
            // Block should be hidden - ensure it's hidden
            this.hideBlock(block.blockId);
            console.log('🙈 Block should be hidden:', block.blockId);
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

      console.log('✅ Search completed - matched:', matchedCount, 'total:', sortedBlocks.length);

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

  // Show a specific block
  showBlock(blockId) {
    if (this.editor && this.editor.commands) {
      this.editor.commands.showBlock(blockId);
    }
  }

  // Show all blocks (used when clearing search)
  showAllBlocks() {
    console.log('👁️ StreamingSearch.showAllBlocks called');
    
    if (this.editor && this.editor.commands) {
      const result = this.editor.commands.showAllBlocks();
      console.log('👁️ showAllBlocks command result:', result);
    }
    
    console.log('✅ All blocks should now be visible');
  }

  // Clear current search and show all blocks
  clearSearch() {
    console.log('🧹 StreamingSearch.clearSearch called');
    
    if (this.searchAbortController) {
      this.searchAbortController.abort();
    }
    
    this.showAllBlocks();
    this.isSearching = false;
    this.currentQuery = '';
    
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

  // Destroy the search instance
  destroy() {
    this.clearSearch();
    this.editor = null;
    this.hiddenBlocksPlugin = null;
  }
}