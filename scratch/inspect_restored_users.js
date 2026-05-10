
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

async function inspectTable() {
  console.log("Inspecting RESTORED Supabase URL:", supabaseUrl);
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.error("Inspection failed:", error);
  } else {
    console.log("Columns found in 'users':", Object.keys(data[0] || {}));
    console.log("Sample user data:", data[0]);
  }
}

inspectTable();
