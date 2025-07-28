import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabase.js';

// Standardize phone number format for consistent user identification
function standardizePhoneNumber(phone) {
  if (!phone) return phone;
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  console.log('🔐 Standardizing phone:', phone, '→ digits:', digits);
  
  // US phone number logic
  if (digits.length === 10) {
    // 10 digits: add +1 country code
    const standardized = `+1${digits}`;
    console.log('🔐 10-digit → +1 format:', standardized);
    return standardized;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // 11 digits starting with 1: add + prefix
    const standardized = `+${digits}`;
    console.log('🔐 11-digit US → + format:', standardized);
    return standardized;
  } else if (phone.startsWith('+') && digits.length >= 10) {
    // Already has + and sufficient digits: use as-is
    console.log('🔐 Already standardized:', phone);
    return phone;
  } else {
    // Fallback: assume US number and add +1
    const standardized = `+1${digits}`;
    console.log('🔐 Fallback → +1 format:', standardized);
    return standardized;
  }
}

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
      const standardPhone = standardizePhoneNumber(phone);
      console.log('🔐 Sending OTP to standardized phone:', standardPhone);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: standardPhone
      });
      
      console.log('🔐 Send OTP result:', { data, error });
      if (error) throw error;
      return { success: true, data, standardPhone };
    } catch (error) {
      console.error('Send OTP error:', error);
      return { success: false, error: error.message };
    }
  },

  async verifyOTP(phone, token) {
    try {
      const standardPhone = standardizePhoneNumber(phone);
      console.log('🔐 Verifying OTP for standardized phone:', standardPhone, 'token:', token);
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: standardPhone,
        token: token,
        type: 'sms'
      });
      
      console.log('🔐 Verify OTP result:', { 
        data: data ? {
          user: data.user ? {
            id: data.user.id,
            phone: data.user.phone,
            created_at: data.user.created_at
          } : null,
          session: data.session ? 'session exists' : null
        } : null, 
        error 
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