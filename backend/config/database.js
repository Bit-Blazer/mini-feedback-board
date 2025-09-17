// config/database.js
const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables!");
  console.error(
    "Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in your .env file"
  );
  process.exit(1);
}

// Create and export Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("✅ Supabase client connected successfully");

module.exports = supabase;