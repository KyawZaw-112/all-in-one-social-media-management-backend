
import { supabaseAdmin } from "../supabaseAdmin.js";

async function inspectOrders() {
    const { data, error } = await supabaseAdmin.rpc('get_table_columns', { table_name: 'orders' });
    if (error) {
        // Fallback to a simple select if RPC doesn't exist
        const { data: cols, error: err } = await supabaseAdmin.from('orders').select('*').limit(0);
        if (err) {
            console.error("Error inspecting orders:", err.message);
        } else {
            // This won't work if empty in some environments, but let's try
            console.log("Orders columns (meta):", cols);
        }
    } else {
        console.log("Orders columns:", data);
    }
}

// Another way: try to insert a dummy and see the error
async function tryInsertOrder() {
    const { error } = await supabaseAdmin.from("orders").insert({
        merchant_id: '00000000-0000-0000-0000-000000000000', // invalid but let's see error
        status: 'pending'
    });
    console.log("Insert Test Error:", error?.message);
}

// tryInsertOrder();
inspectOrders();
