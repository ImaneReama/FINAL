
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

async function checkUsers() {
  // Try to find ANY user to see what columns they have and if we can find them
  const { data, error } = await supabase.from('users').select('id, email, phone').limit(5);
  if (error) {
    console.error("Query failed:", error);
  } else {
    console.log("Users found:", data?.length || 0);
    if (data && data.length > 0) {
      const user = data[0];
      console.log("Testing .or() query with existing user:", user.email || user.phone);
      const loginId = user.email || user.phone;
      const { data: found, error: err } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${loginId},phone.eq.${loginId}`)
        .maybeSingle();
      
      console.log("Found user with .or()?", found ? "Yes" : "No");
      if (err) console.error("Error with .or():", err);
    }
  }
}

checkUsers();
