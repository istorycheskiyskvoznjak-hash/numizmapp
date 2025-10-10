import { createClient } from '@supabase/supabase-js';

// You can find your Supabase URL and anon key in your Supabase project settings.
const supabaseUrl = 'https://zujyupgetmscoqqrtyid.supabase.co';
// IMPORTANT: Replace this with your actual public anon key from your Supabase project settings.
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1anl1cGdldG1zY29xcXJ0eWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MjIzNjYsImV4cCI6MjA3NTQ5ODM2Nn0.arELOmmx0DfBDKitcJVwTgOdxWGGgiqOXAcKt3pPADc'; 

// FIX: Removed the following block of code which was causing a TypeScript error.
// The comparison `supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY'` is always false
// because `supabaseAnonKey` is a constant with a different value. The entire
// block is dead code and has been removed for clarity and to fix the build.

export const supabase = createClient(supabaseUrl, supabaseAnonKey);