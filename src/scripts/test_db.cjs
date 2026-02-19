
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
    console.log("🚀 Testing Database Connectivity after SQL fix...");

    // 1. Get a valid user_id
    const { data: conns } = await supabase.from('platform_connections').select('*').limit(1);
    const userId = conns[0].user_id || conns[0].merchant_id;
    console.log("Using Merchant ID:", userId);

    // 2. Try to insert a test order
    console.log("\n--- Attempting Test Order Insert ---");
    const testOrder = {
        merchant_id: userId,
        full_name: "Verification Admin",
        item_name: "Digital Assurance",
        status: "pending",
        quantity: 1,
        order_source: "Live"
    };
    const { data: inserted, error: insErr } = await supabase.from('orders').insert(testOrder).select();
    if (insErr) {
        console.error("❌ Order Insert Failed:", insErr.message, insErr.details);
    } else {
        console.log("✅ Order Inserted Successfully:", inserted[0].id);
        // Cleanup
        await supabase.from('orders').delete().eq('id', inserted[0].id);
        console.log("✅ Cleanup Successful.");
    }
}

test();
