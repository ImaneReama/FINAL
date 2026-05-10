
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://gwdhvmfrzmtpsuozooqn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3ZGh2bWZyem10cHN1b3pvb3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODYzMjQsImV4cCI6MjA5MzQ2MjMyNH0.JgM2jtIgjN_mVx-EKrjsnCnonAV3HoWqFQ3yERbIbps";
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  const tablesToTry = ['users', 'leads', 'proposals', 'demandes', 'interventions', 'messages', 'reviews'];
  console.log("Checking project:", supabaseUrl);
  for (const table of tablesToTry) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table '${table}': ERROR - ${error.message}`);
    } else {
      console.log(`Table '${table}': EXISTS`);
    }
  }
}

listTables();
