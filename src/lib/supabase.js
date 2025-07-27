import { createClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Auth will not work properly.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: browser,
    autoRefreshToken: browser
  },
  db: {
    schema: 'public'
  }
});

// Helper function to create a client-side filter for user data
// Since we're not using proper JWT auth yet, we filter on client-side
export function createUserFilter(userPhone) {
  return supabase.from('notes').select('*').eq('user', userPhone);
} 