
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://tgzrlezinixdnrnjuprc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnenJsZXppbml4ZG5ybmp1cHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDAxNTEsImV4cCI6MjA5MzY3NjE1MX0.F-RAzR32_BRo--_J3qgMeGI1KH_1C47j0u7B13WSjus";
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
  console.log("Checking Supabase URL:", supabaseUrl);
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.error("Inspection failed:", error);
  } else {
    console.log("Columns found in 'users':", Object.keys(data[0] || {}));
    console.log("Sample user:", data[0]);
  }
}

inspectTable();
