
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

async function testInsert() {
  console.log("Testing insert into 'demandes'...");
  const { data, error } = await supabase.from('demandes').insert([{
    client_id: 1, // Admin or some existing user
    category: 'Test',
    description: 'Test description',
    status: 'pending'
  }]).select();

  if (error) {
    console.error("Insert failed:", error.message);
  } else {
    console.log("Insert success!", data[0].id);
  }
}

testInsert();
