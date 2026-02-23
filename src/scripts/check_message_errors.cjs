const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("🔍 Searching for any error logs in messages...");

    const { data: errors, error } = await supabase
        .from('messages')
        .select('*')
        .eq('status', 'error')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`✅ Found ${errors?.length || 0} error logs.`);
        console.log(JSON.stringify(errors, null, 2));
    }
}

run().catch(console.error);
