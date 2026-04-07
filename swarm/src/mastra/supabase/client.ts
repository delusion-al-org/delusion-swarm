import { createClient } from '@supabase/supabase-js';

// Note: The structure of the URL provided was a postgresql:// connection string.
// The Supabase JS Client expects the REST API URL (https://<project-ref>.supabase.co).
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Supabase tools will fail.');
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
