
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

async function checkTables() {
  console.log("Checking tables in:", supabaseUrl);
  
  // Try to check 'leads' table
  const { data: leads, error: leadsError, count: leadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });
  
  if (leadsError) {
    console.error("Leads table check failed:", leadsError);
  } else {
    console.log("Leads table exists. Count:", leadsCount);
  }

  // Try to check 'proposals' table
  const { data: proposals, error: proposalsError, count: proposalsCount } = await supabase
    .from('proposals')
    .select('*', { count: 'exact', head: true });
  
  if (proposalsError) {
    console.error("Proposals table check failed:", proposalsError);
  } else {
    console.log("Proposals table exists. Count:", proposalsCount);
  }
}

checkTables();
