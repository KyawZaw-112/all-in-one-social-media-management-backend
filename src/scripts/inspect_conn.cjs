const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("🔍 Inspecting platform_connections...");

    const { data: connections, error } = await supabase.from('platform_connections').select('*').limit(10);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("✅ Sample Connections:", JSON.stringify(connections, null, 2));
    }
}

run().catch(console.error);
