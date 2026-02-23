const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("🔍 Inspecting product 002...");
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('name', '002');

    if (error) {
        console.error("❌ Error fetching product:", error);
        return;
    }

    if (!products || products.length === 0) {
        console.log("❓ Product '002' not found (by name). Checking by ID...");
        const { data: pById } = await supabase.from('products').select('*').eq('id', '002');
        console.log("Result:", JSON.stringify(pById, null, 2));
    } else {
        console.log("✅ Found product:", JSON.stringify(products, null, 2));
    }
}

run();
