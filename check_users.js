const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://tgzrlezinixdnrnjuprc.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnenJsZXppbml4ZG5ybmp1cHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDAxNTEsImV4cCI6MjA5MzY3NjE1MX0.F-RAzR32_BRo--_J3qgMeGI1KH_1C47j0u7B13WSjus');

async function check() {
  const { data, error } = await s.from('users').select('name, role');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
check();
