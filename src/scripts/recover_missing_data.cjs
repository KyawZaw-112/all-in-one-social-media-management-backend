const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function recoverMissingData() {
    console.log("=== Recovering missing orders/shipments from completed conversations ===\n");

    // Find all completed conversations whose order_no is missing from both orders and shipments
    const { data: completedConvs, error: compErr } = await supabase
        .from('conversations')
        .select('id, merchant_id, page_id, flow_id, temp_data, created_at')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

    if (compErr) {
        console.error("Error fetching conversations:", compErr.message);
        return;
    }

    let recovered = 0;

    for (const conv of completedConvs) {
        const td = conv.temp_data || {};
        const orderNo = td.order_no;
        if (!orderNo) continue;

        // Check if already exists in orders or shipments
        const { data: existsOrder } = await supabase.from('orders').select('id').eq('order_no', orderNo).maybeSingle();
        const { data: existsShip } = await supabase.from('shipments').select('id').eq('order_no', orderNo).maybeSingle();

        if (existsOrder || existsShip) continue; // Already exists, skip

        // Determine business type from flow
        const { data: flow } = await supabase.from('automation_flows').select('business_type').eq('id', conv.flow_id).maybeSingle();
        const businessType = flow?.business_type || (orderNo.startsWith('CG') ? 'cargo' : 'online_shop');

        console.log(`🔧 Recovering ${orderNo} (${businessType}) from conversation ${conv.id}`);

        if (businessType === 'cargo') {
            const shipmentData = {
                merchant_id: conv.merchant_id,
                conversation_id: conv.id,
                page_id: conv.page_id,
                order_no: orderNo,
                country: td.country,
                shipping: td.shipping,
                item_type: td.item_type,
                item_name: td.item_name,
                item_value: td.item_value,
                weight: td.weight,
                full_name: td.full_name,
                phone: td.phone,
                address: td.address,
                item_photos: td.item_photos,
                notes: td.notes,
                status: "pending",
            };

            const { error } = await supabase.from('shipments').insert(shipmentData);
            if (error) {
                console.error(`  ❌ Failed to recover shipment ${orderNo}:`, error.message);
            } else {
                console.log(`  ✅ Shipment ${orderNo} recovered!`);
                recovered++;
            }
        } else {
            const orderData = {
                merchant_id: conv.merchant_id,
                conversation_id: conv.id,
                page_id: conv.page_id,
                order_no: orderNo,
                item_name: td.product_name || td.item_name,
                quantity: td.quantity,
                full_name: td.full_name,
                phone: td.phone,
                address: td.address,
                payment_method: td.payment_method || td.payment,
                payment: td.payment,
                order_source: td.order_source,
                delivery: td.delivery,
                notes: td.notes,
                total_amount: td.total_amount,
                item_photos: td.item_photos,
                status: "pending",
            };

            if (td.size || td.color) {
                const parts = [];
                if (td.size) parts.push(`Size: ${td.size}`);
                if (td.color) parts.push(`Color: ${td.color}`);
                orderData.item_variant = parts.join(', ');
            }

            const { error } = await supabase.from('orders').insert(orderData);
            if (error) {
                console.error(`  ❌ Failed to recover order ${orderNo}:`, error.message);
            } else {
                console.log(`  ✅ Order ${orderNo} recovered!`);
                recovered++;
            }
        }
    }

    console.log(`\n=== Done! Recovered ${recovered} record(s) ===`);
}

recoverMissingData();
