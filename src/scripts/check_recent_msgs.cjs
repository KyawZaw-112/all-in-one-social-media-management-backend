const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("🔍 Checking for recent messages...");

    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("✅ Recent Messages:", JSON.stringify(messages.map(m => ({
            id: m.id,
            sender_id: m.sender_id,
            body: m.body?.substring(0, 50),
            created_at: m.created_at,
            metadata: m.metadata
        })), null, 2));
    }

    const pageId = "957808180755824";
    const { data: pageMsgs } = await supabase
        .from('messages')
        .select('*')
        .ilike('body', `%${pageId}%`)
        .limit(5);
    console.log("✅ Messages containing Page ID:", JSON.stringify(pageMsgs, null, 2));
}

run().catch(console.error);
