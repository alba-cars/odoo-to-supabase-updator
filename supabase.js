const { createClient } = require('@supabase/supabase-js');

let client = null;

function getSupabaseClient() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required');
  }

  client = createClient(url, key, {
    auth: { persistSession: false },
  });

  return client;
}

module.exports = { getSupabaseClient };
