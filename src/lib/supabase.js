import { createClient } from '@supabase/supabase-js';
import { DISABLE_SUPABASE } from '$lib/config.js';

function createDisabledSupabaseStub() {
  const noopSubscription = { unsubscribe() {} };
  const noopChannel = {
    on() {
      return noopChannel;
    },
    subscribe(callback) {
      callback?.('SUBSCRIBED');
      return Promise.resolve(noopSubscription);
    },
    unsubscribe() {}
  };

  return {
    auth: {
      async getSession() {
        return { data: { session: null }, error: null };
      },
      onAuthStateChange() {
        return { data: { subscription: noopSubscription } };
      },
      async signInWithOtp() {
        return { data: null, error: new Error('Supabase disabled') };
      },
      async verifyOtp() {
        return { data: null, error: new Error('Supabase disabled') };
      },
      async signOut() {
        return { error: null };
      },
      async getUser() {
        return { data: { user: null }, error: new Error('Supabase disabled') };
      }
    },
    removeChannel() {},
    channel() {
      return noopChannel;
    },
    from() {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        maybeSingle: async () => ({ data: null, error: new Error('Supabase disabled') }),
        upsert: async () => ({ data: null, error: new Error('Supabase disabled') })
      };
    }
  };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here';

export const supabase = DISABLE_SUPABASE
  ? createDisabledSupabaseStub()
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      realtime: {
        params: {
          eventsPerSecond: 50 // Increased for better Y.js performance
        }
      },
      global: {
        headers: {
          'X-Client-Info': 'zai-app'
        }
      }
    });
