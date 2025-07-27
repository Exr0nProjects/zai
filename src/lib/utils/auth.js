import { browser } from '$app/environment';

export async function checkOnlineStatus() {
  if (!browser) return true;
  return navigator.onLine;
}

export function formatPhoneNumber(phone) {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Add +1 if US number (10 digits)
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // Add + if not present
  if (!cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }
  
  return cleaned;
} 