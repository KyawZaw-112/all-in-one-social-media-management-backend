
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConstraints() {
    console.log("🕵️‍♂️ Checking constraints for 'orders' table...");

    // We try to insert an empty object to see what it complains about first
    const { error } = await supabase.from('orders').insert({}).select();

    if (error) {
        console.log("Error Message:", error.message);
    } else {
        console.log("✅ Insert succeeded with empty object? Unexpected.");
    }

    // Try to see if we can get table structure via an RPC or raw query if possible 
    // (PostgRest doesn't allow raw SQL, but we can check columns via select)
    const { data, error: selectErr } = await supabase.from('orders').select('*').limit(1);
    if (data && data.length > 0) {
        console.log("Existing Columns:", Object.keys(data[0]));
    }
}

checkConstraints();
