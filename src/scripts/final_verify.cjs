
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalTest() {
    console.log("🚀 Final Database Verification...");

    // 1. Get a valid user_id and page_id
    const { data: conns } = await supabase.from('platform_connections').select('*').limit(1);
    if (!conns || conns.length === 0) {
        console.error("❌ No platform connections found to test with.");
        return;
    }
    const userId = conns[0].user_id || conns[0].merchant_id;
    const pageId = conns[0].page_id;
    console.log("Using Merchant ID:", userId);
    console.log("Using Page ID:", pageId);

    // 2. Try to insert a test order
    console.log("\n--- Testing Order Insert ---");
    const testOrder = {
        merchant_id: userId,
        page_id: pageId,
        full_name: "Final Verification User",
        item_name: "End-to-End Success",
        status: "pending",
        quantity: 1
    };

    const { data: orderIns, error: orderErr } = await supabase.from('orders').insert(testOrder).select();
    if (orderErr) {
        console.error("❌ Order Insert FAILED:", orderErr.message);
    } else {
        console.log("✅ Order Inserted Successfully. ID:", orderIns[0].id);
        await supabase.from('orders').delete().eq('id', orderIns[0].id);
    }

    // 3. Try to insert a test shipment
    console.log("\n--- Testing Shipment Insert ---");
    const testShipment = {
        merchant_id: userId,
        page_id: pageId,
        full_name: "Cargo Verification",
        item_name: "Global Freight",
        status: "pending",
        country: "Thailand",
        shipping: "Express"
    };

    const { data: shipIns, error: shipErr } = await supabase.from('shipments').insert(testShipment).select();
    if (shipErr) {
        console.error("❌ Shipment Insert FAILED:", shipErr.message);
    } else {
        console.log("✅ Shipment Inserted Successfully. ID:", shipIns[0].id);
        await supabase.from('shipments').delete().eq('id', shipIns[0].id);
    }
}

finalTest();
