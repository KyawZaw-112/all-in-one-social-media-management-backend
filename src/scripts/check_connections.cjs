const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("🔍 Investigating Connection Issue...");

    // 1. Fetch all platform connections
    const { data: connections, error: connError } = await supabase.from('platform_connections').select('*');
    if (connError) console.error("Error fetching connections:", connError);
    else console.log("✅ Platform Connections:", JSON.stringify(connections, null, 2));

    // 2. Fetch all merchants
    const { data: merchants, error: merchError } = await supabase.from('merchants').select('id, page_id, business_name, business_type');
    if (merchError) console.error("Error fetching merchants:", merchError);
    else console.log("✅ Merchants Table:", JSON.stringify(merchants, null, 2));

    // 3. Check for raw webhook logs from the last hour
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { data: logs, error: logError } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', 'SYSTEM_DEBUG')
        .gte('created_at', oneHourAgo);

    if (logError) console.error("Error fetching logs:", logError);
    else {
        console.log(`✅ Found ${logs.length} raw webhook debug logs in the last hour.`);
        // Look for "bluh bluh" in the logs if we can identify its page ID from connections
    }
}

run().catch(console.error);
