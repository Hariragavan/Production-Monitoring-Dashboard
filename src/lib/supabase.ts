import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { startupDiagnostic } from './startupDiagnostic';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = (rawUrl?.trim()) || 'https://jdzhsiajsguvqfjdjllu.supabase.co';
const supabaseKey = (rawKey?.trim()) || 'sb_publishable_DCqWCpk9vxPM-UJIi6LoIg_0Y_ndTVv';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-supabase-url')
);

if (isSupabaseConfigured) {
  startupDiagnostic.log('Supabase configured successfully', 'success', { url: supabaseUrl });
} else {
  startupDiagnostic.log('Supabase credentials missing or invalid - running in offline/local storage mode', 'warn');
}

/**
 * Executes a promise with an enforced timeout so the dashboard never hangs indefinitely
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 5000,
  fallbackValue?: T,
  description = 'Network Request'
): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((resolve, reject) => {
    timeoutId = setTimeout(() => {
      console.warn(`[TV Timeout] ${description} timed out after ${timeoutMs}ms`);
      if (fallbackValue !== undefined) {
        resolve(fallbackValue);
      } else {
        reject(new Error(`Timeout: ${description} took longer than ${timeoutMs}ms`));
      }
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

let client: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (err) {
    startupDiagnostic.log('Failed to create Supabase client', 'error', err);
  }
}

export const supabase: SupabaseClient | null = client;
