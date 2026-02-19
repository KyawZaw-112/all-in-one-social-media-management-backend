
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listTables() {
    console.log("📂 Listing all tables in 'public' schema...");

    // Using a common Supabase trick to list tables via an invalid query
    const { data, error } = await supabase.from('non_existent_table').select('*');
    if (error && error.message.includes('allowlisted')) {
        console.log("Cannot list tables directly via postgrest errors easily.");
    }

    // Let's try to query some likely names
    const commonNames = ['orders', 'shipments', 'merchants', 'conversations', 'messages', 'automation_flows', 'platform_connections', 'payments', 'users', 'profiles'];
    for (const name of commonNames) {
        const { error: e } = await supabase.from(name).select('id').limit(1);
        if (!e) {
            console.log(`✅ Table exists: ${name}`);
        } else if (e.code === '42P01') {
            console.log(`❌ Table missing: ${name}`);
        } else {
            console.log(`❓ Table ${name} error: ${e.message}`);
        }
    }
}

listTables();
