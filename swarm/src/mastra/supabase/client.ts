import { createClient } from '@supabase/supabase-js';

// Note: The structure of the URL provided was a postgresql:// connection string.
// The Supabase JS Client expects the REST API URL (https://<project-ref>.supabase.co).
const isMock = !process.env.SUPABASE_URL || (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_ANON_KEY);
const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'mock-key';

if (isMock) {
  console.warn('⚠️  WARNING: Supabase URL or Key is missing. Using mock values. Supabase tools (register, lookup) WILL fail if they actually make network requests.');
}

/**
 * Singleton Supabase client for agent operations.
 * Uses the Service Role Key to bypass RLS for administrative swarm actions.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
