
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://tgzrlezinixdnrnjuprc.supabase.co";
// I don't have the anon key for this one, but maybe I can try to see if it responds
const supabase = createClient(supabaseUrl, "dummy");

async function check() {
  console.log("Checking fallback Supabase URL:", supabaseUrl);
  try {
    const res = await fetch(supabaseUrl);
    console.log("Status:", res.status);
  } catch (e) {
    console.error("Failed to reach fallback URL:", e.message);
  }
}

check();
