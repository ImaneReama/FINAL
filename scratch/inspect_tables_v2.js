
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

async function inspectTables() {
  console.log("Inspecting 'demandes' and 'interventions'...");
  
  const { data: dData } = await supabase.from('demandes').select('*').limit(1);
  if (dData && dData[0]) {
    console.log("Columns in 'demandes':", Object.keys(dData[0]));
  } else {
    console.log("'demandes' is empty.");
  }

  const { data: iData } = await supabase.from('interventions').select('*').limit(1);
  if (iData && iData[0]) {
    console.log("Columns in 'interventions':", Object.keys(iData[0]));
  } else {
    console.log("'interventions' is empty.");
  }
}

inspectTables();
