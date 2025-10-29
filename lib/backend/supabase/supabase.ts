import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.SUPABASE_API_KEY as string;
// Create a single supabase client for interacting with your database
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
/**
 * Get the current authenticated user's ID
 * @returns The user ID
 * @throws Error if no user is authenticated
 */
export async function getUserId(): Promise<string> {
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    console.error('Supabase auth error:', error);
    throw new Error('User not authenticated, supabase, supabase.ts,');
  }

  return user.id;
}