const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("🔍 Listing ALL SYSTEM_DEBUG logs...");

    const { data: logs, error } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', 'SYSTEM_DEBUG')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`✅ Found ${logs?.length || 0} debug logs.`);
        logs.forEach(l => {
            const body = JSON.parse(l.body);
            const pageId = body.entry?.[0]?.id;
            console.log(`- Time: ${l.created_at} | Page: ${pageId} | Entry IDs: ${body.entry?.map(e => e.id).join(', ')}`);
        });
    }
}

run().catch(console.error);
