import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://tgzrlezinixdnrnjuprc.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnenJsZXppbml4ZG5ybmp1cHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDAxNTEsImV4cCI6MjA5MzY3NjE1MX0.F-RAzR32_BRo--_J3qgMeGI1KH_1C47j0u7B13WSjus";

export const supabase = createClient(supabaseUrl, supabaseKey);
