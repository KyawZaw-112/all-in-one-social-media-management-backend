const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSpecificOrder() {
    // Check the conversation for LS898151
    console.log("=== Conversation for LS898151 ===");
    const { data: conv } = await supabase
        .from('conversations')
        .select('id, temp_data')
        .eq('id', 'fc53c04d-4d32-41f4-9e60-f3eca17fb7ce')
        .single();

    if (conv) {
        console.log("Temp Data:", JSON.stringify(conv.temp_data, null, 2));
    }

    // Check the actual inserted order
    console.log("\n=== Order LS898151 ===");
    const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('order_no', 'LS898151')
        .single();

    if (order) {
        console.log("Order:", JSON.stringify(order, null, 2));
    }

    // Check product 001 for merchant 2244689c
    console.log("\n=== Product 001 for merchant ===");
    const { data: prod } = await supabase
        .from('products')
        .select('*')
        .eq('name', '001')
        .eq('merchant_id', order?.merchant_id);

    if (prod) {
        console.log("Product:", JSON.stringify(prod, null, 2));
    }
}

checkSpecificOrder();
