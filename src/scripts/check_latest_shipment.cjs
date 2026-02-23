const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLatestShipment() {
    console.log("Checking latest shipment...");

    const { data: latestShipment, error } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error("Error fetching latest shipment:", error.message);
    } else if (latestShipment && latestShipment.length > 0) {
        console.log("Latest Shipment structure and timestamp:", JSON.stringify(latestShipment[0], null, 2));
    } else {
        console.log("No shipments found.");
    }
}

checkLatestShipment();
