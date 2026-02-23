const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCounts() {
    console.log("Checking row counts for 'orders' and 'shipments'...");

    const { count: orderCount, error: orderError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

    if (orderError) {
        console.error("Error fetching order count:", orderError.message);
    } else {
        console.log(`Orders count: ${orderCount}`);
    }

    const { count: shipmentCount, error: shipmentError } = await supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true });

    if (shipmentError) {
        console.error("Error fetching shipment count:", shipmentError.message);
    } else {
        console.log(`Shipments count: ${shipmentCount}`);
    }

    // Check latest 1 order to see the structure and timestamps
    const { data: latestOrder, error: latestOrderError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (latestOrderError) {
        console.error("Error fetching latest order:", latestOrderError.message);
    } else if (latestOrder && latestOrder.length > 0) {
        console.log("Latest Order structure and timestamp:", JSON.stringify(latestOrder[0], null, 2));
    } else {
        console.log("No orders found to inspect structure.");
    }
}

checkCounts();
