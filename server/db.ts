import { createClient } from "@supabase/supabase-js";
import ws from 'ws';
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback

// Check environment variables
let supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey && supabaseUrl !== "https://dummy.supabase.co");

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials not found. Database operations will fail unless configured.");
  supabaseUrl = "https://dummy.supabase.co";
  supabaseKey = "dummy-key";
}

// Server-side supabase client uses the Service Role Key to bypass RLS policies
// and administrate the database natively.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    realtime: { transport: ws }   // ← this is the entire fix
  }
);