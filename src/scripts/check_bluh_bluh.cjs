const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("🔍 Filtering Connection Data...");

    const bluhBluhPageId = "957808180755824";

    // 1. Get connections for Bluh bluh
    const { data: connections } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('platform_page_id', bluhBluhPageId);
    console.log("✅ Platform Connections (Bluh bluh):", JSON.stringify(connections, null, 2));

    // 2. Get merchant for Bluh bluh
    // The previous output showed page_id as "liberated-..."
    const { data: merchants } = await supabase
        .from('merchants')
        .select('*')
        .ilike('page_id', `%${bluhBluhPageId}%`);
    console.log("✅ Merchants (Bluh bluh):", JSON.stringify(merchants, null, 2));

    if (merchants && merchants.length > 0) {
        const merchantId = merchants[0].id;
        // 3. Check automation flows for this merchant
        const { data: flows } = await supabase
            .from('automation_flows')
            .select('*')
            .eq('merchant_id', merchantId);
        console.log("✅ Automation Flows (Bluh bluh):", JSON.stringify(flows, null, 2));
    }
}

run().catch(console.error);
