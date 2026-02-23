const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("🔍 Deep checking logs for 957808180755824...");

    const pageId = "957808180755824";
    const { data: logs, error } = await supabase
        .from('messages')
        .select('*')
        .or(`body.ilike.%${pageId}%, sender_id.eq.${pageId}, user_id.eq.66594720-77bb-4a5c-aa49-1504a2a0c4fe`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`✅ Found ${logs?.length || 0} relative logs.`);
        console.log(JSON.stringify(logs, null, 2));
    }
}

run().catch(console.error);
