const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("🔍 Precise check of platform_connections...");

    const { data: conn, error } = await supabase
        .from('platform_connections')
        .select('*')
        .ilike('page_name', '%Bluh%');

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`✅ Found ${conn?.length || 0} connections.`);
        conn.forEach(c => {
            console.log(`- ID: ${c.id}`);
            console.log(`- Page ID: [${c.page_id}] (length: ${c.page_id.length})`);
            console.log(`- User ID: ${c.user_id}`);
            console.log(`- Merchant ID: ${c.merchant_id}`);
        });
    }

    const testId = "957808180755824";
    const { data: exact } = await supabase.from('platform_connections').select('*').eq('page_id', testId);
    console.log(`\n🧪 Testing exact match with "${testId}": ${exact?.length > 0 ? 'SUCCESS' : 'FAILED'}`);
}

run().catch(console.error);
