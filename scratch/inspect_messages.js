
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

async function inspectMessages() {
  const { data } = await supabase.from('messages').select('*').limit(1);
  if (data && data[0]) {
    console.log("Columns in 'messages':", Object.keys(data[0]));
  } else {
    console.log("'messages' is empty.");
  }
}

inspectMessages();
