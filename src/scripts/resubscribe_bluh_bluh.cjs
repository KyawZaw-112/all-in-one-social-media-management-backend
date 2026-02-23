const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const pageId = "957808180755824";
    console.log(`🚀 Force Re-subscribing Page: ${pageId}...`);

    const { data: conn } = await supabase
        .from('platform_connections')
        .select('page_access_token')
        .eq('page_id', pageId)
        .single();

    if (!conn) {
        console.error("❌ Token not found");
        return;
    }

    const token = conn.page_access_token;

    try {
        const subscribeUrl = `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps`;
        const res = await axios.post(subscribeUrl, {
            subscribed_fields: "messages,messaging_postbacks,messaging_optins"
        }, {
            params: { access_token: token }
        });
        console.log("✅ Subscription Response:", res.data);

        // Verify again
        const checkRes = await axios.get(subscribeUrl, {
            params: { access_token: token }
        });
        console.log("📊 Current Subscriptions:", JSON.stringify(checkRes.data.data, null, 2));

    } catch (err) {
        console.error("❌ Error:", err.response?.data || err.message);
    }
}

run().catch(console.error);
