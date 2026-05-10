
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

async function testRegister() {
  const email = `test_${Date.now()}@example.com`;
  const password = "password123";
  console.log("Attempting to register:", email);

  const { data, error } = await supabase.from('users').insert([{
    email,
    password,
    name: "Test User",
    role: "automobiliste"
  }]).select().single();

  if (error) {
    console.error("Registration failed:", error);
  } else {
    console.log("Registration success:", data.id);
    
    // Now try to login with this user using the same logic as server.ts
    const loginId = email;
    console.log("Attempting login (with quotes):", loginId);
    const q1 = await supabase.from('users').select('*').or(`email.eq."${loginId}",phone.eq."${loginId}"`).maybeSingle();
    console.log("Login with quotes:", q1.data ? "Found" : "Not Found", q1.error || "");

    console.log("Attempting login (without quotes):", loginId);
    const q2 = await supabase.from('users').select('*').or(`email.eq.${loginId},phone.eq.${loginId}`).maybeSingle();
    console.log("Login without quotes:", q2.data ? "Found" : "Not Found", q2.error || "");
  }
}

testRegister();
