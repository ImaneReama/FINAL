
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

async function testQuery() {
  const { data: allUsers } = await supabase.from('users').select('email, phone').limit(1);
  if (!allUsers || allUsers.length === 0) {
    console.log("No users found to test with.");
    return;
  }
  const testEmail = allUsers[0].email;
  console.log("Testing with email:", testEmail);

  // With quotes
  const q1 = await supabase.from('users').select('*').or(`email.eq."${testEmail}",phone.eq."${testEmail}"`).maybeSingle();
  console.log("Result with quotes:", q1.data ? "Found" : "Not Found", q1.error || "");

  // Without quotes
  const q2 = await supabase.from('users').select('*').or(`email.eq.${testEmail},phone.eq.${testEmail}`).maybeSingle();
  console.log("Result without quotes:", q2.data ? "Found" : "Not Found", q2.error || "");
}

testQuery();
