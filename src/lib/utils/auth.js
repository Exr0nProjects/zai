import { browser } from '$app/environment';

export async function checkOnlineStatus() {
  if (!browser) return true;
  return navigator.onLine;
}

export function formatPhoneNumber(phone) {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // If it looks like a US number (10 digits), add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If it's international format (11+ digits), just add +
  if (cleaned.length >= 11) {
    return `+${cleaned}`;
  }
  
  // If less than 10 digits, it's incomplete
  throw new Error('Phone number must be at least 10 digits');
} 