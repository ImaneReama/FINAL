
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  console.log("Listing tables for:", supabaseUrl);
  
  // We can't directly list tables with anon key easily without RPC or similar,
  // but we can try to guess common names or check 'users' again.
  
  const tablesToTry = ['users', 'leads', 'proposals', 'demandes', 'interventions', 'messages', 'reviews'];
  
  for (const table of tablesToTry) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table '${table}': ERROR - ${error.message} (${error.code})`);
    } else {
      console.log(`Table '${table}': EXISTS`);
    }
  }
}

listTables();
