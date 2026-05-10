
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
  const { data, error } = await supabase.from('leads').select('*').limit(1);
  if (error) {
    console.error("Leads error:", error);
  } else {
    console.log("Leads data:", data);
  }

  const { data: pData, error: pError } = await supabase.from('proposals').select('*').limit(1);
  if (pError) {
    console.error("Proposals error:", pError);
  } else {
    console.log("Proposals data:", pData);
  }
}

checkTables();
