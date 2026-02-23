const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("🔍 Checking Supabase Buckets...");
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error("❌ Error listing buckets:", error);
        return;
    }

    console.log("✅ Buckets found:", JSON.stringify(buckets, null, 2));
}

run();
