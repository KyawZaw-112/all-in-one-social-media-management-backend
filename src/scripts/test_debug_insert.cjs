const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("🔍 Checking messages table definition and 0000 merchant...");

    // 1. Check if 0000 merchant exists
    const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .maybeSingle();

    console.log("✅ 0000 Merchant Exists:", !!merchant);

    // 2. Try a test insert with 0000
    console.log("🧪 Trying test insert with 0000 merchant...");
    const { error: insertError } = await supabaseAdmin.from("messages").insert({
        user_id: "00000000-0000-0000-0000-000000000000",
        sender_id: "TEST_INSERT_PROBE",
        body: "Test Body",
        channel: "facebook",
        status: "received"
    });

    if (insertError) {
        console.error("❌ Insert FAILED:", insertError);
    } else {
        console.log("✅ Insert SUCCEEDED!");
    }
}

run().catch(console.error);
