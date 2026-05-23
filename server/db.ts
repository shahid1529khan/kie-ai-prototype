import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl !== "https://dummy.supabase.co"
);

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials not found. Database operations will fail unless configured.");
}

export const supabase = createClient(
  supabaseUrl || "https://dummy.supabase.co",
  supabaseKey || "dummy-key",
  {
    realtime: { transport: ws },
  }
);
