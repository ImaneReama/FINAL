const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://tgzrlezinixdnrnjuprc.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnenJsZXppbml4ZG5ybmp1cHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDAxNTEsImV4cCI6MjA5MzY3NjE1MX0.F-RAzR32_BRo--_J3qgMeGI1KH_1C47j0u7B13WSjus');

async function check() {
  const { data, error } = await s.from('messages').select('*').limit(1);
  if (error) {
    console.error("SELECT * ERROR:", error);
  } else {
    console.log("SELECT * SUCCESS. Data length:", data.length);
    if (data.length > 0) {
      console.log("Columns:", Object.keys(data[0]));
    } else {
      // Try to insert a dummy to see columns? No.
      // Try to select a non-existent column to see the error message?
      const { error: err2 } = await s.from('messages').select('non_existent_column').limit(1);
      console.log("SELECT non_existent ERROR (may show columns):", err2);
    }
  }
}
check();
