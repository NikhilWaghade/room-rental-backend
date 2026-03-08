import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Supabase ENV variables missing");
    process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log("✅ Supabase connected");