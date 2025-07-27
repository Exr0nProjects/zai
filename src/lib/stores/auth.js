import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import Cookies from 'js-cookie';

// Auth state store
export const isAuthenticated = writable(false);
export const user = writable(null);
export const isLoading = writable(true);

// Initialize auth state from cookies on browser load
if (browser) {
  const token = Cookies.get('auth_token');
  const userData = Cookies.get('user_data');
  
  if (token && userData) {
    try {
      const parsedUser = JSON.parse(userData);
      user.set(parsedUser);
      isAuthenticated.set(true);
    } catch (e) {
      console.error('Error parsing user data:', e);
      Cookies.remove('auth_token');
      Cookies.remove('user_data');
    }
  }
  isLoading.set(false);
}

// Auth actions
export const authActions = {
  login: (token, userData) => {
    if (browser) {
      Cookies.set('auth_token', token, { expires: 30, secure: true, sameSite: 'strict' });
      Cookies.set('user_data', JSON.stringify(userData), { expires: 30, secure: true, sameSite: 'strict' });
      user.set(userData);
      isAuthenticated.set(true);
    }
  },
  
  logout: () => {
    if (browser) {
      Cookies.remove('auth_token');
      Cookies.remove('user_data');
      user.set(null);
      isAuthenticated.set(false);
    }
  }
}; 