const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deepCheck() {
    // 1. Check if any orders were created today (Feb 23)
    console.log("=== ORDERS CREATED AFTER Feb 22 ===");
    const { data: recentOrders, error: ordErr } = await supabase
        .from('orders')
        .select('id, order_no, full_name, item_name, created_at, status')
        .gte('created_at', '2026-02-22T00:00:00Z')
        .order('created_at', { ascending: false });

    if (ordErr) {
        console.error("Error:", ordErr.message);
    } else {
        console.log(`Found ${recentOrders.length} orders since Feb 22:`);
        recentOrders.forEach(o => console.log(`  ${o.order_no} | ${o.full_name} | ${o.item_name} | ${o.created_at} | ${o.status}`));
    }

    // 2. Check if any shipments were created today (Feb 23)
    console.log("\n=== SHIPMENTS CREATED AFTER Feb 22 ===");
    const { data: recentShipments, error: shipErr } = await supabase
        .from('shipments')
        .select('id, order_no, full_name, item_name, created_at, status')
        .gte('created_at', '2026-02-22T00:00:00Z')
        .order('created_at', { ascending: false });

    if (shipErr) {
        console.error("Error:", shipErr.message);
    } else {
        console.log(`Found ${recentShipments.length} shipments since Feb 22:`);
        recentShipments.forEach(s => console.log(`  ${s.order_no} | ${s.full_name} | ${s.item_name} | ${s.created_at} | ${s.status}`));
    }

    // 3. Check conversations that are "completed" but had no matching order/shipment
    console.log("\n=== COMPLETED CONVERSATIONS (last 5) ===");
    const { data: completedConvs, error: compErr } = await supabase
        .from('conversations')
        .select('id, merchant_id, page_id, flow_id, status, temp_data, created_at')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);

    if (compErr) {
        console.error("Error:", compErr.message);
    } else {
        for (const c of completedConvs) {
            const orderNo = c.temp_data?.order_no;
            console.log(`\n  Conv ${c.id} (completed ${c.created_at})`);
            console.log(`    Order No from temp_data: ${orderNo}`);

            if (orderNo) {
                // Check if this order_no exists in orders or shipments
                const { data: matchOrder } = await supabase
                    .from('orders')
                    .select('id')
                    .eq('order_no', orderNo)
                    .maybeSingle();

                const { data: matchShip } = await supabase
                    .from('shipments')
                    .select('id')
                    .eq('order_no', orderNo)
                    .maybeSingle();

                console.log(`    Found in orders: ${matchOrder ? 'YES' : 'NO'}`);
                console.log(`    Found in shipments: ${matchShip ? 'YES' : 'NO'}`);
            }
        }
    }

    // 4. Check conversations in "active" state that look like they have all data
    console.log("\n=== ACTIVE CONVERSATIONS WITH COMPLETE DATA ===");
    const { data: activeConvs, error: actErr } = await supabase
        .from('conversations')
        .select('id, merchant_id, flow_id, status, temp_data, created_at, updated_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

    if (actErr) {
        console.error("Error:", actErr.message);
    } else {
        for (const c of activeConvs) {
            const td = c.temp_data || {};
            const keys = Object.keys(td).filter(k => !k.startsWith('_'));
            console.log(`\n  Conv ${c.id}`);
            console.log(`    Created: ${c.created_at}, Updated: ${c.updated_at}`);
            console.log(`    Fields filled: ${keys.length} (${keys.join(', ')})`);
            console.log(`    Has order_no: ${td.order_no || 'NO'}`);
        }
    }

    // 5. Check the orders table schema by trying an insert with dry-run approach
    console.log("\n=== CHECKING FOR INSERT ERRORS (orders table column check) ===");
    const { error: schemaErr } = await supabase
        .from('orders')
        .select('id, merchant_id, conversation_id, page_id, sender_id, sender_name, item_name, item_variant, quantity, full_name, phone, address, payment_method, order_source, status, notes, total_amount, created_at, updated_at, payment, delivery, order_no, item_photos')
        .limit(0);

    if (schemaErr) {
        console.error("Schema check error:", schemaErr.message);
    } else {
        console.log("All expected columns exist in orders table.");
    }
}

deepCheck();
