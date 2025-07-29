import * as Y from 'yjs';
import { supabase } from '$lib/supabase.js';

const LOG = false;

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
      if (LOG) console.log('SupabaseProvider: Document synced');
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
      if (LOG) console.log('SupabaseProvider: Loading document for user:', this.user.id, 'document:', this.documentName);
      
      // First check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('SupabaseProvider: Authentication failed:', authError);
        return;
      }
      
      const { data, error } = await supabase
        .from('documents')
        .select('ydoc_state')
        .eq('owner_id', this.user.id)
        .eq('name', this.documentName)
        .maybeSingle(); // Use maybeSingle() to handle 0 or 1 rows gracefully
      
      if (error) {
        console.error('SupabaseProvider: Query error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        if (error.code !== 'PGRST116') { // PGRST116 = row not found
          throw error;
        }
      }
      
      if (data?.ydoc_state) {
        if (LOG) console.log('📥 SupabaseProvider: Raw data received:', {
          type: typeof data.ydoc_state,
          isArray: Array.isArray(data.ydoc_state),
          isUint8Array: data.ydoc_state instanceof Uint8Array,
          length: data.ydoc_state?.length,
          firstBytes: data.ydoc_state instanceof Uint8Array ? 
            Array.from(data.ydoc_state.slice(0, 10)) : 
            data.ydoc_state?.toString?.().slice(0, 50)
        });
        
        try {
          // Handle different data formats from Supabase
          let uint8Array;
          if (data.ydoc_state instanceof Uint8Array) {
            uint8Array = data.ydoc_state;
          } else if (Array.isArray(data.ydoc_state)) {
            uint8Array = new Uint8Array(data.ydoc_state);
          } else if (typeof data.ydoc_state === 'string') {
            
            // Check if it's hex-encoded JSON (Supabase's format)
            if (data.ydoc_state.startsWith('\\x')) {
              try {
                // Remove \x prefix and decode hex to string
                const hexString = data.ydoc_state.slice(2); // Remove '\x' prefix
                let jsonString = '';
                for (let i = 0; i < hexString.length; i += 2) {
                  const hexByte = hexString.substr(i, 2);
                  jsonString += String.fromCharCode(parseInt(hexByte, 16));
                }
                
                // Parse JSON object back to array
                const jsonObject = JSON.parse(jsonString);
                const arrayData = Object.values(jsonObject);
                uint8Array = new Uint8Array(arrayData);
              } catch (error) {
                console.error('📥 Failed to decode hex-encoded JSON:', error);
                return;
              }
            } else {
              // Try base64 decode (fallback)
              try {
                const binaryString = atob(data.ydoc_state);
                uint8Array = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  uint8Array[i] = binaryString.charCodeAt(i);
                }
              } catch (error) {
                console.warn('📥 Invalid base64 data, ignoring:', error);
                console.log('📥 Problematic string:', data.ydoc_state.slice(0, 100));
                return; // Skip this corrupted data
              }
            }
          } else {
            console.warn('📥 Unknown ydoc_state format:', typeof data.ydoc_state, data.ydoc_state);
            return;
          }
          
          // Only apply if we have valid data
          if (uint8Array && uint8Array.length > 0) {
            Y.applyUpdate(this.doc, uint8Array);
          }
        } catch (error) {
          console.error('📥 Failed to parse document state:', error);
          // Don't throw - just start with empty document
        }
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
        console.error('💾 Supabase save error:', error);
        throw error;
      }
      
    } catch (error) {
      console.error('💾 Failed to save document:', error);
    }
  }
  
  handleUpdate(update, origin) {
    if (LOG) console.log('⚡ Y.js update detected:', {
      updateLength: update.length,
      origin: origin === this ? 'REMOTE' : 'LOCAL',
      willSave: origin !== this
    });
    
    // Don't save updates that came from Supabase (to avoid loops)
    if (origin === this) {
      if (LOG) console.log('⚡ Ignoring remote update (from Supabase)');
      return;
    }
    
    // Debounce saves to avoid too many database writes
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.saveDocument();
    }, 1000); // Save 1 second after last change
  }
  
  setupRealtimeSubscription() {
    if (!this.user?.id) {
      console.warn('🔔 Cannot setup realtime: No user ID');
      return;
    }
    
    if (LOG) console.log('🔔 Setting up realtime subscription for user:', this.user.id, 'document:', this.documentName);
    
    // Subscribe to realtime changes for this document
    this.channel = supabase
      .channel(`document:${this.documentName}:${this.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'documents',
          filter: `owner_id=eq.${this.user.id} AND name=eq.${this.documentName}`
        },
        (payload) => {
          if (LOG) console.log('🔔 RAW realtime payload received:', payload);
          this.handleRealtimeUpdate(payload);
        }
      )
      .subscribe((status, error) => {
        if (LOG) console.log('🔔 Realtime subscription status:', status);
        if (error) {
          console.error('🔔 Realtime subscription error:', error);
        }
      });
      
    if (LOG) console.log('🔔 Realtime channel created:', this.channel);
    
    // Add a test method to manually trigger updates for debugging
    window.testRealtimeUpdate = async () => {
      console.log('🧪 Testing manual realtime update...');
      try {
        const { error } = await supabase
          .from('documents')
          .update({ 
            last_updated: new Date().toISOString(),
            test_field: Math.random() 
          })
          .eq('owner_id', this.user.id)
          .eq('name', this.documentName);
          
        if (error) {
          console.error('🧪 Test update failed:', error);
        } else {
          console.log('🧪 Test update sent successfully');
        }
      } catch (error) {
        console.error('🧪 Test update error:', error);
      }
    };
  }
  
  async handleRealtimeUpdate(payload) {
    try {
      if (LOG) console.log('🔔 Received realtime update:', {
        event: payload.eventType,
        old_state_exists: !!payload.old?.ydoc_state,
        new_state_exists: !!payload.new?.ydoc_state,
        new_state_type: typeof payload.new?.ydoc_state
      });
      
      if (payload.new?.ydoc_state) {
        // Use the same decoding logic as loadDocument
        const data = { ydoc_state: payload.new.ydoc_state };
        let uint8Array;
        
        if (data.ydoc_state instanceof Uint8Array) {
          if (LOG) console.log('🔔 Using Uint8Array directly');
          uint8Array = data.ydoc_state;
        } else if (Array.isArray(data.ydoc_state)) {
          if (LOG) console.log('🔔 Converting from Array to Uint8Array');
          uint8Array = new Uint8Array(data.ydoc_state);
        } else if (typeof data.ydoc_state === 'string') {
          if (LOG) console.log('🔔 Decoding string data...');
          
          // Check if it's hex-encoded JSON (Supabase's format)
          if (data.ydoc_state.startsWith('\\x')) {
            if (LOG) console.log('🔔 Detected hex-encoded string in realtime');
            try {
              // Remove \x prefix and decode hex to string
              const hexString = data.ydoc_state.slice(2);
              let jsonString = '';
              for (let i = 0; i < hexString.length; i += 2) {
                const hexByte = hexString.substr(i, 2);
                jsonString += String.fromCharCode(parseInt(hexByte, 16));
              }
              
              // Parse JSON object back to array
              const jsonObject = JSON.parse(jsonString);
              const arrayData = Object.values(jsonObject);
              uint8Array = new Uint8Array(arrayData);
            } catch (error) {
              console.error('🔔 Failed to decode hex-encoded JSON in realtime:', error);
              return;
            }
          } else {
            // Try base64 decode (fallback)
            try {
              const binaryString = atob(data.ydoc_state);
              uint8Array = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                uint8Array[i] = binaryString.charCodeAt(i);
              }
            } catch (error) {
              console.warn('🔔 Invalid base64 data in realtime:', error);
              return;
            }
          }
        }
        
        if (uint8Array && uint8Array.length > 0) {
          if (LOG) console.log('🔔 Applying realtime Y.js update, length:', uint8Array.length);
          Y.applyUpdate(this.doc, uint8Array, this); // Use 'this' as origin to prevent loop
        }
      }
    } catch (error) {
      console.error('🔔 Failed to apply realtime update:', error);
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
    
    if (LOG) console.log('SupabaseProvider: Disconnected');
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