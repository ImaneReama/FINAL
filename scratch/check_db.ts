
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://tgzrlezinixdnrnjuprc.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log("Checking demandes table...");
  const { data: demandes, error: dError } = await supabase.from('demandes').select('*').limit(5);
  if (dError) {
    console.error("Error fetching demandes:", dError);
  } else {
    console.log("Found demandes:", demandes.length);
    console.log(JSON.stringify(demandes, null, 2));
  }

  console.log("\nChecking users table for roles...");
  const { data: users, error: uError } = await supabase.from('users').select('id, role, email').limit(10);
  if (uError) {
    console.error("Error fetching users:", uError);
  } else {
    console.log("Found users:", users.length);
    console.log(JSON.stringify(users, null, 2));
  }
}

checkData();
