const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("🚀 Creating Dummy Debug Merchant...");

    const dummyId = "00000000-0000-0000-0000-000000000000";

    const { error } = await supabase.from('merchants').upsert({
        id: dummyId,
        page_id: "SYSTEM_DEBUG_PAGE",
        business_name: "System Debug",
        business_type: "online_shop",
        subscription_status: "active"
    });

    if (error) {
        console.error("❌ Failed to create dummy merchant:", error);
    } else {
        console.log("✅ Dummy Debug Merchant ready!");
    }
}

run().catch(console.error);
