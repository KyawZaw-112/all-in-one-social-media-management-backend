const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const pageId = "100530332303174"; // Kay
    console.log(`📡 Diagnosing Page: ${pageId} (Kay)...`);

    const { data: conn } = await supabase
        .from('platform_connections')
        .select('page_access_token')
        .eq('page_id', pageId)
        .limit(1)
        .single();

    if (!conn) {
        console.error("❌ Token not found");
        return;
    }

    const token = conn.page_access_token;
    const appToken = `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`;

    try {
        const debugResponse = await axios.get(`https://graph.facebook.com/debug_token?input_token=${token}&access_token=${appToken}`);
        console.log("📊 Token Info (Kay):", JSON.stringify(debugResponse.data.data.scopes, null, 2));
    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

run().catch(console.error);
