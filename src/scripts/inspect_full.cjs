
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspect() {
    console.log("🧐 Inspecting 'orders' table schema...");

    // Attempt a select with NO columns specified to get a result set
    const { data, error } = await supabase.from('orders').select('*').limit(1);

    if (error) {
        console.error("❌ Select Failed:", error.message);
    } else if (data && data.length > 0) {
        console.log("✅ Columns found in existing row:", Object.keys(data[0]));
    } else {
        console.log("⚠️ Table is empty. Trying to guess columns by causing an error...");
        const { error: err } = await supabase.from('orders').insert({ dummy_column_test: 1 });
        console.log("Error hint (this should list valid columns if schema mismatch):", err?.message);
    }

    // Try to get a single row from ANY table to see if we can get system info
    console.log("\n--- Checking for common columns in orders ---");
    const testFields = ['id', 'merchant_id', 'user_id', 'customer_name', 'item_name', 'status', 'created_at'];
    for (const f of testFields) {
        const { error: e } = await supabase.from('orders').select(f).limit(1);
        if (!e) {
            console.log(`✅ Column '${f}' EXISTS.`);
        } else {
            console.log(`❌ Column '${f}' MISSING.`);
        }
    }
}

inspect();
