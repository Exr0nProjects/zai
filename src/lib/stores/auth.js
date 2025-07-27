import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabase.js';

// Auth state stores
export const user = writable(null);
export const session = writable(null);
export const isAuthenticated = writable(false);
export const isLoading = writable(true);

// Initialize auth state from Supabase session
if (browser) {
  // Get initial session with error handling
  supabase.auth.getSession()
    .then(({ data: { session: currentSession } }) => {
      if (currentSession) {
        user.set(currentSession.user);
        session.set(currentSession);
        isAuthenticated.set(true);
      }
      isLoading.set(false);
    })
    .catch((error) => {
      console.warn('Supabase auth initialization failed:', error);
      isLoading.set(false);
    });

  // Listen for auth changes
  supabase.auth.onAuthStateChange((event, newSession) => {
    if (newSession) {
      user.set(newSession.user);
      session.set(newSession);
      isAuthenticated.set(true);
    } else {
      user.set(null);
      session.set(null);
      isAuthenticated.set(false);
    }
    isLoading.set(false);
  });
}

// Auth actions using Supabase Auth
export const authActions = {
  async sendOTP(phone) {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phone
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Send OTP error:', error);
      return { success: false, error: error.message };
    }
  },

  async verifyOTP(phone, token) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: token,
        type: 'sms'
      });
      
      if (error) throw error;
      
      // Session is automatically set by onAuthStateChange
      return { success: true, data };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { success: false, error: error.message };
    }
  },

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // State is automatically cleared by onAuthStateChange
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }
}; 