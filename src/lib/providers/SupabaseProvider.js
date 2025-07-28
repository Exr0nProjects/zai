import * as Y from 'yjs';
import { supabase } from '$lib/supabase.js';

/**
 * Custom Y.js provider that syncs with Supabase database
 * Provides serverless collaboration without needing WebSocket server
 */
export class SupabaseProvider {
  constructor(documentName, doc, user) {
    this.documentName = documentName;
    this.doc = doc;
    this.user = user;
    this.synced = false;
    this.channel = null;
    this.saveTimeout = null;
    
    // Bind methods
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleRealtimeUpdate = this.handleRealtimeUpdate.bind(this);
    
    // Set up Y.js document listeners
    this.doc.on('update', this.handleUpdate);
    
    // Initialize
    this.init();
  }
  
  async init() {
    try {
      // Load initial document state from Supabase
      await this.loadDocument();
      
      // Set up realtime subscription for collaborative updates
      this.setupRealtimeSubscription();
      
      this.synced = true;
      console.log('SupabaseProvider: Document synced');
    } catch (error) {
      console.error('SupabaseProvider: Failed to initialize:', error);
    }
  }
  
  async loadDocument() {
    if (!this.user?.id) {
      console.warn('SupabaseProvider: No user ID available');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('ydoc_state')
        .eq('owner_id', this.user.id)
        .eq('name', this.documentName)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = row not found
        throw error;
      }
      
      if (data?.ydoc_state) {
        // Apply the saved document state
        const uint8Array = new Uint8Array(data.ydoc_state);
        Y.applyUpdate(this.doc, uint8Array);
      }
    } catch (error) {
      console.error('SupabaseProvider: Failed to load document:', error);
    }
  }
  
  async saveDocument() {
    if (!this.user?.id) {
      console.warn('SupabaseProvider: No user ID available for saving');
      return;
    }
    
    try {
      // Get the current document state as binary
      const state = Y.encodeStateAsUpdate(this.doc);
      
      // Upsert to Supabase
      const { error } = await supabase
        .from('documents')
        .upsert({
          name: this.documentName,
          owner_id: this.user.id,
          ydoc_state: state
        }, {
          onConflict: 'owner_id,name'
        });
      
      if (error) {
        throw error;
      }
      
      console.log('SupabaseProvider: Document saved');
    } catch (error) {
      console.error('SupabaseProvider: Failed to save document:', error);
    }
  }
  
  handleUpdate(update, origin) {
    // Don't save updates that came from Supabase (to avoid loops)
    if (origin === this) return;
    
    // Debounce saves to avoid too many database writes
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.saveDocument();
    }, 1000); // Save 1 second after last change
  }
  
  setupRealtimeSubscription() {
    if (!this.user?.id) return;
    
    // Subscribe to realtime changes for this document
    this.channel = supabase
      .channel(`document:${this.documentName}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
          filter: `owner_id=eq.${this.user.id} AND name=eq.${this.documentName}`
        },
        this.handleRealtimeUpdate
      )
      .subscribe();
  }
  
  async handleRealtimeUpdate(payload) {
    try {
      if (payload.new?.ydoc_state) {
        // Get the updated state and apply it
        const uint8Array = new Uint8Array(payload.new.ydoc_state);
        Y.applyUpdate(this.doc, uint8Array, this);
        console.log('SupabaseProvider: Applied realtime update');
      }
    } catch (error) {
      console.error('SupabaseProvider: Failed to apply realtime update:', error);
    }
  }
  
  disconnect() {
    // Clean up event listeners
    this.doc.off('update', this.handleUpdate);
    
    // Clean up realtime subscription
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    
    // Clear any pending saves
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    
    console.log('SupabaseProvider: Disconnected');
  }
  
  destroy() {
    this.disconnect();
  }
  
  // For compatibility with other Y.js providers
  get awareness() {
    return null; // We could implement awareness later
  }
  
  get wsconnected() {
    return this.synced;
  }
} 