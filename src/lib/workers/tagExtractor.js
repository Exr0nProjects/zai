/**
 * Web Worker for extracting tags from document content
 * Processes text content and finds hashtags to build suggestions list
 */

// Tag extraction regex - matches #word patterns (not at start of line to avoid markdown headers)
const TAG_REGEX = /(?:^|\s)#([^\s#]+)/g;

// Store for discovered tags with frequency count
let discoveredTags = new Map();
let isProcessing = false;

self.addEventListener('message', async (event) => {
  const { type, content, requestId } = event.data;
  
  try {
    switch (type) {
      case 'EXTRACT_TAGS':
        await extractTags(content, requestId);
        break;
      
      case 'GET_TAGS':
        self.postMessage({
          type: 'TAGS_RESULT',
          tags: Array.from(discoveredTags.entries()).map(([tag, count]) => ({
            id: tag,
            label: tag,
            count
          })).sort((a, b) => b.count - a.count),
          requestId
        });
        break;
      
      case 'CLEAR_TAGS':
        discoveredTags.clear();
        self.postMessage({
          type: 'TAGS_CLEARED',
          requestId
        });
        break;
      
      case 'ADD_TAG':
        await addTag(event.data.tag, requestId);
        break;
      
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error.message,
      requestId
    });
  }
});

async function extractTags(content, requestId) {
  if (isProcessing) {
    self.postMessage({
      type: 'PROCESSING_BUSY',
      requestId
    });
    return;
  }
  
  isProcessing = true;
  
  try {
    self.postMessage({
      type: 'PROCESSING_STARTED',
      requestId
    });
    
    // Clear previous tags
    discoveredTags.clear();
    
    // Extract tags from content (both plain text and HTML)
    if (typeof content === 'string' && content.length > 0) {
      let textContent = content;
      
      // If content is HTML, extract text but also look for data-id attributes in mention nodes
      if (content.includes('<') && content.includes('>')) {
        // Extract existing mention tags from HTML
        const mentionRegex = /<span[^>]*data-id="([^"]*)"[^>]*class="[^"]*tag-mention[^"]*"[^>]*>([^<]*)<\/span>/g;
        let mentionMatch;
        while ((mentionMatch = mentionRegex.exec(content)) !== null) {
          const tagId = mentionMatch[1];
          if (tagId && tagId.length > 1 && !/^\d+$/.test(tagId)) {
            const currentCount = discoveredTags.get(tagId) || 0;
            discoveredTags.set(tagId, currentCount + 1);
          }
        }
        
        // Remove HTML tags for plain text extraction
        textContent = content.replace(/<[^>]*>/g, ' ');
      }
      
      // Extract hashtags from plain text
      let match;
      TAG_REGEX.lastIndex = 0; // Reset regex
      
      while ((match = TAG_REGEX.exec(textContent)) !== null) {
        const tag = match[1].toLowerCase();
        
        // Skip single character tags and numbers-only tags
        if (tag.length > 1 && !/^\d+$/.test(tag)) {
          const currentCount = discoveredTags.get(tag) || 0;
          discoveredTags.set(tag, currentCount + 1);
        }
        
        // Yield control periodically for large documents
        if (discoveredTags.size % 100 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }
    
    // Send results
    const tagsList = Array.from(discoveredTags.entries()).map(([tag, count]) => ({
      id: tag,
      label: tag,
      count
    })).sort((a, b) => b.count - a.count);
    
    self.postMessage({
      type: 'TAGS_EXTRACTED',
      tags: tagsList,
      totalTags: tagsList.length,
      requestId
    });
    
  } finally {
    isProcessing = false;
    self.postMessage({
      type: 'PROCESSING_COMPLETED',
      requestId
    });
  }
}

async function addTag(tag, requestId) {
  try {
    // Add or increment tag count
    const currentCount = discoveredTags.get(tag) || 0;
    discoveredTags.set(tag, currentCount + 1);
    
    self.postMessage({
      type: 'TAG_ADDED',
      tag: tag,
      requestId
    });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error.message,
      requestId
    });
  }
} 