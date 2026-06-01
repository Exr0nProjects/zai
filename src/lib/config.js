const envValue = (import.meta.env?.VITE_DISABLE_SUPABASE ?? import.meta.env?.PUBLIC_DISABLE_SUPABASE ?? '').toString().toLowerCase();

// Treat any truthy string ("true", "1", "yes") as enabling offline-only mode
const truthyValues = new Set(['true', '1', 'yes', 'on']);

export const DISABLE_SUPABASE = truthyValues.has(envValue);

export const OFFLINE_FALLBACK_USER = {
  id: 'offline-user',
  phone: 'offline',
  email: 'offline@local',
};
