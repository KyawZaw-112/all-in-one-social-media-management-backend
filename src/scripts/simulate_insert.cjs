const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simulateInsert() {
    // This is the temp_data from a recent completed order conversation (fc53c04d)
    // We'll try to insert with the same cleanData approach used in webhook.ts

    // First, check what columns exist in orders
    console.log("=== Testing column existence for orders ===");
    const testCols = [
        'confirmation', 'order_source', 'size', 'color', 'item_id',
        'product_name', 'item_price', 'currency', 'item_image',
        'item_desc', 'item_variants', 'rate_per_kg', 'order_no',
        'item_name', 'quantity', 'delivery', 'address', 'full_name',
        'phone', 'notes', 'payment', 'payment_method'
    ];

    for (const col of testCols) {
        const { error } = await supabase.from('orders').select(col).limit(0);
        const status = error ? `❌ MISSING (${error.message.substring(0, 60)})` : '✅ EXISTS';
        console.log(`  orders.${col}: ${status}`);
    }

    console.log("\n=== Testing column existence for shipments ===");
    const shipCols = [
        'confirmation', 'order_source', 'size', 'color', 'item_id',
        'product_name', 'item_price', 'currency', 'item_image',
        'item_desc', 'item_variants', 'rate_per_kg', 'order_no',
        'item_name', 'item_type', 'item_value', 'weight', 'country',
        'shipping', 'full_name', 'phone', 'address', 'item_photos'
    ];

    for (const col of shipCols) {
        const { error } = await supabase.from('shipments').select(col).limit(0);
        const status = error ? `❌ MISSING (${error.message.substring(0, 60)})` : '✅ EXISTS';
        console.log(`  shipments.${col}: ${status}`);
    }

    // Now try a test insert with extra columns to see the actual error
    console.log("\n=== Simulating order insert with extra 'confirmation' field ===");
    const { error: simErr } = await supabase.from('orders').insert({
        merchant_id: '00000000-0000-0000-0000-000000000001',
        order_no: 'TEST_DELETE_ME',
        full_name: 'Test',
        confirmation: 'Yes',
        item_name: 'test',
    });

    if (simErr) {
        console.error("Insert error:", simErr.message);
        console.error("Full error:", JSON.stringify(simErr, null, 2));
    } else {
        console.log("Insert SUCCEEDED (cleaning up...)");
        await supabase.from('orders').delete().eq('order_no', 'TEST_DELETE_ME');
    }
}

simulateInsert();
