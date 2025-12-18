
import { createClient } from '@supabase/supabase-js';

// Safe environment variable accessor to prevent "Cannot read properties of undefined" errors
const getSafeEnv = (key: string): string => {
  try {
    // Check for Vite's import.meta.env
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return (import.meta.env as any)[key] || '';
    }
    // Fallback for other environments
    if (typeof process !== 'undefined' && process.env) {
      return (process.env as any)[key] || '';
    }
  } catch (e) {
    console.warn(`Environment variable ${key} could not be accessed safely.`);
  }
  return '';
};

const supabaseUrl = getSafeEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getSafeEnv('VITE_SUPABASE_ANON_KEY');

// Check if keys are actually set to non-default values
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('your-project');

// Use placeholder if not configured to prevent crash during initialization, 
// but isSupabaseConfigured flag should be checked before making calls.
const clientUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const clientKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder';

export const supabase = createClient(clientUrl, clientKey);
