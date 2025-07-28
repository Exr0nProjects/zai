/**
 * Tag Manager - Interface for tag extraction and management
 * Manages web worker communication and provides reactive tag suggestions
 */

import { writable } from 'svelte/store';

// Create stores for reactive tag state
export const tagSuggestions = writable([]);
export const isTagProcessing = writable(false);
export const tagStats = writable({ total: 0, lastUpdate: null });

class TagManager {
  constructor() {
    this.worker = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the tag manager and web worker
   */
  async init() {
    if (this.initialized) return;

    try {
      // Initialize web worker
      this.worker = new Worker('/tagExtractor.js', { type: 'module' });
      
      // Set up message handling
      this.worker.addEventListener('message', (event) => {
        this.handleWorkerMessage(event.data);
      });

      // Set up error handling
      this.worker.addEventListener('error', (error) => {
        console.error('Tag worker error:', error);
        isTagProcessing.set(false);
      });

      this.initialized = true;
      console.log('Tag manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize tag manager:', error);
      throw error;
    }
  }

  /**
   * Handle messages from the web worker
   */
  handleWorkerMessage(data) {
    const { type, requestId } = data;
    const request = this.pendingRequests.get(requestId);

    switch (type) {
      case 'PROCESSING_STARTED':
        isTagProcessing.set(true);
        break;

      case 'PROCESSING_COMPLETED':
        isTagProcessing.set(false);
        break;

      case 'TAGS_EXTRACTED':
        tagSuggestions.set(data.tags);
        tagStats.set({
          total: data.totalTags,
          lastUpdate: new Date()
        });
        if (request) {
          request.resolve(data.tags);
          this.pendingRequests.delete(requestId);
        }
        break;

      case 'TAGS_RESULT':
        tagSuggestions.set(data.tags);
        if (request) {
          request.resolve(data.tags);
          this.pendingRequests.delete(requestId);
        }
        break;

      case 'TAGS_CLEARED':
        tagSuggestions.set([]);
        tagStats.set({ total: 0, lastUpdate: new Date() });
        if (request) {
          request.resolve();
          this.pendingRequests.delete(requestId);
        }
        break;

      case 'TAG_ADDED':
        // Update suggestions with new tag
        tagSuggestions.update(tags => {
          const newTag = { id: data.tag, label: data.tag, count: 1 };
          const existing = tags.find(t => t.id === data.tag);
          if (existing) {
            existing.count += 1;
            return [...tags].sort((a, b) => b.count - a.count);
          } else {
            return [newTag, ...tags].sort((a, b) => b.count - a.count);
          }
        });
        if (request) {
          request.resolve();
          this.pendingRequests.delete(requestId);
        }
        break;

      case 'ERROR':
        console.error('Tag worker error:', message.error || 'Unknown error');
        isTagProcessing.set(false);
        if (request) {
          request.reject(new Error(message.error || 'Unknown error'));
          this.pendingRequests.delete(requestId);
        }
        break;

      case 'PROCESSING_BUSY':
        // Worker is busy, ignore for now
        break;

      default:
        console.warn('Unknown worker message type:', type);
    }
  }

  /**
   * Extract tags from content using the web worker
   */
  async extractTags(content) {
    if (!this.initialized) {
      await this.init();
    }

    const requestId = ++this.requestId;
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      
      this.worker.postMessage({
        type: 'EXTRACT_TAGS',
        content,
        requestId
      });
      
      // Set timeout for request
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Tag extraction timeout'));
        }
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Get current tags from worker
   */
  async getTags() {
    if (!this.initialized) {
      await this.init();
    }

    const requestId = ++this.requestId;
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      
      this.worker.postMessage({
        type: 'GET_TAGS',
        requestId
      });
      
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Get tags timeout'));
        }
      }, 5000);
    });
  }

  /**
   * Clear all tags
   */
  async clearTags() {
    if (!this.initialized) {
      await this.init();
    }

    const requestId = ++this.requestId;
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      
      this.worker.postMessage({
        type: 'CLEAR_TAGS',
        requestId
      });
      
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Clear tags timeout'));
        }
      }, 5000);
    });
  }

  /**
   * Filter tags based on query for suggestions
   */
  filterTags(tags, query) {
    if (!query) return tags.slice(0, 10); // Return top 10 when no query
    
    const lowercaseQuery = query.toLowerCase();
    return tags
      .filter(tag => tag.label.toLowerCase().includes(lowercaseQuery))
      .slice(0, 9); // Limit to 9 suggestions to leave room for "Create new" option
  }

  /**
   * Add a new tag to the registry
   */
  async addNewTag(tagLabel) {
    if (!this.initialized) {
      await this.init();
    }

    const requestId = ++this.requestId;
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      
      this.worker.postMessage({
        type: 'ADD_TAG',
        tag: tagLabel.toLowerCase(),
        requestId
      });
      
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Add tag timeout'));
        }
      }, 5000);
    });
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
    this.initialized = false;
  }
}

// Export singleton instance
export const tagManager = new TagManager(); 