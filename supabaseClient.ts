import { createClient } from '@supabase/supabase-js';

// You can find your Supabase URL and anon key in your Supabase project settings.
const supabaseUrl = 'https://zujyupgetmscoqqrtyid.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1anl1cGdldG1zY29xcXJ0eWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MjIzNjYsImV4cCI6MjA3NTQ5ODM2Nn0.arELOmmx0DfBDKitcJVwTgOdxWGGgiqOXAcKt3pPADc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
