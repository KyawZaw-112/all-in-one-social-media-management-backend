const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("🔍 Checking Active Integrations...");

    // 1. Get all active connections
    const { data: connections } = await supabase
        .from('platform_connections')
        .select('page_id, page_name, user_id');

    console.log(`✅ Active Connections Found: ${connections?.length || 0}`);

    for (const conn of (connections || [])) {
        console.log(`\n--- Page: ${conn.page_name} (${conn.page_id}) ---`);

        // Check merchant
        const { data: merchant } = await supabase
            .from('merchants')
            .select('id, business_name, business_type, subscription_status')
            .eq('id', conn.user_id)
            .single();

        if (merchant) {
            console.log(`  Merchant: ${merchant.business_name} (${merchant.id})`);
            console.log(`  Status: ${merchant.subscription_status}`);

            // Check flows
            const { data: flows } = await supabase
                .from('automation_flows')
                .select('id, name, is_active')
                .eq('merchant_id', merchant.id);

            console.log(`  Flows count: ${flows?.length || 0}`);
            flows?.forEach(f => console.log(`  - [${f.is_active ? 'ACTIVE' : 'INACTIVE'}] ${f.name}`));
        } else {
            console.log(`  ❌ NO MERCHANT FOUND FOR USER_ID: ${conn.user_id}`);
        }
    }
}

run().catch(console.error);
